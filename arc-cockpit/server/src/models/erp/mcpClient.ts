/**
 * Minimal MCP client for the Airgen (Twenty) ERP MCP server, over JSON-RPC streamable HTTP.
 * Same contract the `agentic-erp` CLI uses: initialize, tools/list, tools/call
 * (get_tool_catalog, learn_tools, execute_tool).
 * The bearer token is read from the environment and never logged.
 */

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface ToolInfo {
  name: string;
  description?: string;
  inputSchema?: { properties?: Record<string, { type?: string }>; required?: string[] };
}

export class McpError extends Error {}

export class McpClient {
  private sessionId: string | null = null;
  private nextId = 1;
  private tools: ToolInfo[] = [];
  private executeKeys: { name: string; args: string } | null = null;

  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly timeoutMs = 60_000,
  ) {
    if (!url) throw new McpError('AGENTIC_ERP_URL is not set');
    if (!token) throw new McpError('AGENTIC_ERP_TOKEN (or ERP_API_KEY) is not set');
  }

  static fromEnv() {
    return new McpClient(process.env.AGENTIC_ERP_URL ?? '', process.env.AGENTIC_ERP_TOKEN ?? process.env.ERP_API_KEY ?? '');
  }

  private async post(body: object, expectReply = true): Promise<JsonRpcResponse | null> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      authorization: `Bearer ${this.token}`,
    };
    if (this.sessionId) headers['mcp-session-id'] = this.sessionId;
    const res = await fetch(this.url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(this.timeoutMs) });
    const sid = res.headers.get('mcp-session-id');
    if (sid) this.sessionId = sid;
    if (res.status === 401 || res.status === 403) throw new McpError(`ERP rejected the API key (HTTP ${res.status}). Check the key and its role.`);
    if (!res.ok && res.status !== 202) throw new McpError(`ERP MCP request failed: HTTP ${res.status} ${await res.text().catch(() => '')}`.slice(0, 500));
    if (!expectReply) return null;
    const text = await res.text();
    const type = res.headers.get('content-type') ?? '';
    return type.includes('text/event-stream') ? parseSse(text) : (JSON.parse(text) as JsonRpcResponse);
  }

  private async rpc(method: string, params?: object): Promise<unknown> {
    const reply = await this.post({ jsonrpc: '2.0', id: this.nextId++, method, params });
    if (!reply) throw new McpError(`No reply to ${method}`);
    if (reply.error) throw new McpError(`${method}: ${reply.error.message}`);
    return reply.result;
  }

  async connect(): Promise<void> {
    await this.rpc('initialize', {
      protocolVersion: '2025-03-26',
      capabilities: {},
      clientInfo: { name: 'arc-cockpit', version: '0.1.0' },
    });
    await this.post({ jsonrpc: '2.0', method: 'notifications/initialized' }, false);
    const list = (await this.rpc('tools/list', {})) as { tools?: ToolInfo[] };
    this.tools = list.tools ?? [];
    const exec = this.tools.find((t) => t.name === 'execute_tool');
    if (exec) {
      const props = Object.entries(exec.inputSchema?.properties ?? {});
      const name = props.find(([, p]) => p.type === 'string')?.[0] ?? 'toolName';
      const args = props.find(([, p]) => p.type === 'object')?.[0] ?? 'arguments';
      this.executeKeys = { name, args };
    }
  }

  /** Calls an MCP tool directly and returns its parsed payload. */
  async callTool(name: string, args: object): Promise<unknown> {
    const result = (await this.rpc('tools/call', { name, arguments: args })) as {
      content?: { type: string; text?: string }[];
      structuredContent?: unknown;
      isError?: boolean;
    };
    const text = result.content?.find((c) => c.type === 'text')?.text;
    if (result.isError) throw new McpError(`${name}: ${text ?? 'tool error'}`);
    if (result.structuredContent !== undefined) return result.structuredContent;
    if (text === undefined) return result;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /** Runs an ERP tool, through execute_tool when the server routes tools that way. */
  async run(toolName: string, args: object): Promise<unknown> {
    if (this.tools.some((t) => t.name === toolName) || !this.executeKeys) return this.callTool(toolName, args);
    return this.callTool('execute_tool', { [this.executeKeys.name]: toolName, [this.executeKeys.args]: args });
  }

  async catalog(): Promise<unknown> {
    return this.tools.some((t) => t.name === 'get_tool_catalog') ? this.callTool('get_tool_catalog', {}) : { tools: this.tools };
  }

  async learn(toolNames: string[]): Promise<unknown> {
    return this.callTool('learn_tools', { toolNames, aspects: ['schema', 'description'] });
  }

  listedToolNames(): string[] {
    return this.tools.map((t) => t.name);
  }
}

function parseSse(text: string): JsonRpcResponse {
  const events = text
    .split(/\r?\n/)
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim())
    .filter(Boolean);
  for (let i = events.length - 1; i >= 0; i--) {
    try {
      const msg = JSON.parse(events[i]) as JsonRpcResponse;
      if (msg.result !== undefined || msg.error) return msg;
    } catch {
      /* ignore keep-alives */
    }
  }
  throw new McpError('No JSON-RPC response in event stream');
}

export interface Page {
  rows: Record<string, unknown>[];
  hasNextPage: boolean | null;
  total: number | null;
}

const REFERENCE_KEYS = new Set(['objectNameSingular', 'objectNamePlural', 'objectName', 'recordId', 'displayName', 'url']);

/** A Twenty "record reference" ({objectNameSingular, recordId, displayName}) is a link, not the record. */
const isReference = (v: unknown) => isObj(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => REFERENCE_KEYS.has(k));
const isRecordArray = (v: unknown): v is Record<string, unknown>[] =>
  Array.isArray(v) && v.length > 0 && v.every((x) => isObj(x) && !isReference(isObj(x.node) ? x.node : x));

/**
 * Pulls the record array out of whatever envelope a find_many_* tool returns.
 * Searches breadth-first (records before anything nested inside them) and skips record-reference lists,
 * which Twenty returns next to the real records.
 */
export function extractPage(payload: unknown): Page {
  let rows: Record<string, unknown>[] | null = null;
  let hasNextPage: boolean | null = null;
  let total: number | null = null;
  const queue: { v: unknown; depth: number }[] = [{ v: payload, depth: 0 }];
  while (queue.length) {
    const { v, depth } = queue.shift()!;
    if (depth > 6) continue;
    if (typeof v === 'string') {
      const t = v.trim();
      if (t.startsWith('{') || t.startsWith('[')) {
        try {
          queue.push({ v: JSON.parse(t), depth: depth + 1 });
        } catch {
          /* plain text */
        }
      }
      continue;
    }
    if (rows === null && isRecordArray(v)) {
      rows = v.map((x) => (isObj(x.node) ? x.node : x)) as Record<string, unknown>[];
      continue; // never look inside records for paging info or more arrays
    }
    if (Array.isArray(v)) continue;
    if (!isObj(v)) continue;
    if (hasNextPage === null && typeof v.hasNextPage === 'boolean') hasNextPage = v.hasNextPage;
    if (total === null) for (const k of ['totalCount', 'total', 'count']) if (typeof v[k] === 'number') total = v[k] as number;
    // preferred keys first, so an envelope's records win over sibling lists
    const keys = Object.keys(v).sort((a, b) => rank(a) - rank(b));
    for (const k of keys) queue.push({ v: v[k], depth: depth + 1 });
  }
  return { rows: rows ?? [], hasNextPage, total };
}

const PREFERRED = ['records', 'data', 'result', 'items', 'results', 'edges', 'nodes'];
const rank = (k: string) => (PREFERRED.includes(k) ? PREFERRED.indexOf(k) : PREFERRED.length);

export function extractRecords(payload: unknown): Record<string, unknown>[] {
  return extractPage(payload).rows;
}

export const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
