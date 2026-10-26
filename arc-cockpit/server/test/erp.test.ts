import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { extractPage, McpClient } from '../src/models/erp/mcpClient.js';
import { loadErpData } from '../src/models/erp/erpSource.js';
import { buildRepository } from '../src/models/repository.js';

/**
 * A fake of the Airgen (Twenty) ERP MCP server, shaped like the real one: SSE replies, a session header,
 * tools reached through execute_tool, `select` required ('*' = all fields), limit capped at 100,
 * and a reply envelope where record references come before the records.
 */
const managers = [
  { id: 'cm-uuid-1', name: 'Altaf Malik', cmId: 'CM-01', team: 'Sales', status: 'ACTIVE' },
  { id: 'cm-uuid-2', name: 'Erum Faraz', cmId: 'CM-02', team: 'Sales', status: 'ACTIVE' },
  { id: 'cm-uuid-3', name: 'Jalal Mouati', cmId: 'CM-03', team: 'Sales', status: 'ACTIVE' },
  { id: 'cm-uuid-4', name: 'Old Manager', cmId: 'CM-09', team: 'Sales', status: 'INACTIVE' },
];
const accounts = Array.from({ length: 7 }, (_, i) => ({ id: `acc-uuid-${i}`, name: `Account ${i}`, accountId: `ACC-${i}`, vertical: i % 2 ? 'Hospitality' : 'Government' }));
const opportunities = Array.from({ length: 250 }, (_, i) => ({
  id: `uuid-${i}`,
  name: `2026-O-${String(i).padStart(5, '0')}`,
  opportunityId: `guid-${i}`,
  accountId: i === 0 ? { recordId: 'acc-uuid-0', displayName: 'Account 0' } : `ACC-${i % 7}`,
  cmId: i % 2 ? 'CM-01' : 'CM-02',
  status: i % 3 === 0 ? 'WON' : i % 3 === 1 ? 'OPEN' : 'LOST',
  stage: 'Technical Proposal',
  forecastCategory: 'PIPELINE',
  probability: 50,
  estGp: 1000,
  actualGp: i % 3 === 0 ? 2000 : null,
  createdDate: '2026-05-01',
  estCloseDate: '2026-08-15',
  actualCloseDate: i % 3 === 1 ? null : '2026-07-20',
  lostReason: i % 3 === 2 && i < 10 ? 'Price' : null,
}));
const goals = [
  { id: 'g1', name: 'Q3-2026: Altaf Malik | CM Actual GP | Quarter 3', cmId: 'Altaf Malik', fiscalYear: 2026, fiscalPeriod: 'Q3', goalMetric: 'Actual GP', gpTarget: 614250, crmGuid: 'e618', targetSource: 'CRM export' },
  { id: 'g2', name: 'Q3-2026: Erum Faraz | CM Actual GP | Quarter 3', cmId: 'CM-02', fiscalYear: 2026, fiscalPeriod: 'Q3', goalMetric: 'Actual GP', gpTarget: 731250, crmGuid: 'c54b', targetSource: 'CRM export' },
  { id: 'g3', name: 'Q3-2026: Zahir Kader-Pre-Sales', cmId: null, fiscalYear: 2026, fiscalPeriod: 'Q3', goalMetric: 'Pre-Sales Actual GP', gpTarget: 775000, crmGuid: '6375', targetSource: 'CRM export' },
  // period only in the name, owner only in the name
  { id: 'g4', name: 'Q4-2026: Jalal Mouati | CM Actual GP | Quarter 4', cmId: null, fiscalYear: 2026, fiscalPeriod: null, goalMetric: null, gpTarget: 702000, crmGuid: 'aa11', targetSource: 'Sample' },
  { id: 'g5', name: 'Broken row', cmId: 'Altaf Malik', fiscalYear: 2026, fiscalPeriod: 'Q2', goalMetric: 'Actual GP', gpTarget: null, crmGuid: 'bb22', targetSource: 'CRM export' },
];
const tables: Record<string, Record<string, unknown>[]> = {
  find_many_arc_opportunities: opportunities,
  find_many_arc_gp_targets: goals,
  find_many_arc_client_managers: managers,
  find_many_arc_accounts: accounts,
  find_many_opportunities_og: [{ id: 'og-1', name: 'not mine' }],
};

let server: Server;
let url = '';
const seen = { auth: '', session: '', calls: [] as { tool: string; limit: number; offset: number; select: string[] }[] };
const mode = { starRefused: false };

beforeAll(async () => {
  server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      seen.auth = req.headers.authorization ?? '';
      const msg = JSON.parse(body);
      if (msg.method === 'notifications/initialized') return res.writeHead(202).end();
      if (msg.method !== 'initialize') seen.session = String(req.headers['mcp-session-id'] ?? '');
      const send = (result: unknown) => {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'mcp-session-id': 'sess-1' });
        res.end(`event: message\ndata: ${JSON.stringify({ jsonrpc: '2.0', id: msg.id, result })}\n\n`);
      };
      const text = (v: unknown) => send({ content: [{ type: 'text', text: JSON.stringify(v) }] });
      const fail = (message: string) => send({ isError: true, content: [{ type: 'text', text: JSON.stringify({ success: false, message }) }] });
      if (msg.method === 'initialize') return send({ protocolVersion: '2025-03-26', capabilities: {} });
      if (msg.method === 'tools/list')
        return send({
          tools: [
            { name: 'get_tool_catalog', inputSchema: { properties: {} } },
            { name: 'learn_tools', inputSchema: { properties: { toolNames: { type: 'array' } } } },
            { name: 'execute_tool', inputSchema: { properties: { toolName: { type: 'string' }, arguments: { type: 'object' } } } },
          ],
        });
      if (msg.method === 'tools/call') {
        const { name, arguments: a } = msg.params;
        if (name === 'get_tool_catalog') return text({ tools: Object.keys(tables).map((t) => ({ name: t })) });
        if (name === 'learn_tools') {
          const t = a.toolNames[0];
          const props = Object.fromEntries(Object.keys(tables[t]?.[0] ?? {}).filter((k) => k !== 'id').map((k) => [k, { $ref: '#/$defs/__schema1' }]));
          return text({ tools: [{ name: t, inputSchema: { type: 'object', properties: { select: { type: 'array', description: "Required. Use '*'" }, limit: {}, offset: {}, ...props } } }] });
        }
        if (name === 'execute_tool') {
          const { limit, offset, select } = a.arguments;
          if (!Array.isArray(select) || !select.length) return fail('Select at least one field in select parameter');
          if (limit > 100) return fail('limit must be <= 100');
          if (mode.starRefused && select.includes('*')) return fail('Field "*" does not exist');
          seen.calls.push({ tool: a.toolName, limit, offset, select });
          const all = tables[a.toolName] ?? [];
          const rows = all.slice(offset, offset + limit).map((r) => (select.includes('*') ? r : Object.fromEntries(Object.entries(r).filter(([k]) => k === 'id' || select.includes(k)))));
          return text({
            success: true,
            message: `Found ${rows.length} records`,
            recordReferences: rows.map((r) => ({ objectNameSingular: 'x', recordId: r.id, displayName: r.name })),
            result: { records: rows, totalCount: all.length, hasNextPage: offset + limit < all.length },
          });
        }
      }
      res.writeHead(400).end();
    });
  });
  await new Promise<void>((r) => server.listen(0, r));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`;
});

afterAll(() => server.close());

describe('Airgen ERP connector', () => {
  it('reads every page (limit 100), skips record references and keeps values exact', async () => {
    seen.calls = [];
    const raw = await loadErpData(new McpClient(url, 'test-token'));
    expect(seen.auth).toBe('Bearer test-token');
    expect(seen.session).toBe('sess-1');
    const oppCalls = seen.calls.filter((c) => c.tool === 'find_many_arc_opportunities');
    expect(oppCalls.map((c) => c.offset)).toEqual([0, 100, 200]);
    expect(seen.calls.every((c) => c.limit <= 100 && c.select[0] === '*')).toBe(true);
    expect(raw.records).toHaveLength(250);

    const o = raw.records[0];
    expect(o.guid).toBe('guid-0');
    expect(o.opportunityId).toBe('2026-O-00000');
    expect(o.account).toBe('Account 0'); // accountId resolved through the account table
    expect(o.vertical).toBe('Government'); // from the account
    expect(o.clientManager).toBe('Erum Faraz'); // cmId code resolved through the client manager table
    expect(o.estimatedGP).toBe(1000);
    expect(o.actualGP).toBe(2000);
    expect(o.actualClose).toBe('2026-07-20');
    expect(o.createdOn).toBe('2026-05-01');
    expect(raw.records[1].actualGP).toBeNull(); // missing stays missing
    expect(raw.records[2].lossReason).toBe('Price');
    expect(raw.source.label).toContain('arc_opportunities');
  });

  it('reads GP targets: codes resolved, owner and quarter from the name when needed, bad rows reported', async () => {
    const raw = await loadErpData(new McpClient(url, 'test-token'));
    expect(raw.goals).toHaveLength(4);
    expect(raw.goals.find((g) => g.goalId === 'c54b')?.owner).toBe('Erum Faraz');
    expect(raw.goals.find((g) => g.owner === 'Zahir Kader')?.metric).toBe('Pre-Sales Actual GP');
    expect(raw.goals.find((g) => g.owner === 'Jalal Mouati')).toMatchObject({ quarter: 'Q4', fiscalYear: 2026, metric: 'Actual GP', targetAED: 702000, source: 'Sample' });
    expect(raw.source.warnings.some((w) => w.includes('1 GP target rows skipped') && w.includes('Broken row'))).toBe(true);
    // client manager directory from the ERP table, inactive kept but marked
    expect(raw.clientManagers.map((m) => m.name)).toEqual(['Altaf Malik', 'Erum Faraz', 'Jalal Mouati', 'Old Manager']);
    expect(raw.clientManagers.find((m) => m.name === 'Old Manager')?.active).toBe(false);
  });

  it('feeds the governed model: ERP statuses match the status rules, sample targets are flagged', async () => {
    const repo = buildRepository(await loadErpData(new McpClient(url, 'test-token')));
    expect(new Set(repo.opportunities.map((o) => o.group))).toEqual(new Set(['WON', 'OPEN', 'LOST']));
    expect(repo.hasSampleGoals).toBe(true);
  });

  it("falls back to the schema's field list when select '*' is refused", async () => {
    mode.starRefused = true;
    try {
      const raw = await loadErpData(new McpClient(url, 'test-token'));
      expect(raw.records).toHaveLength(250);
      expect(raw.records[0].estimatedGP).toBe(1000);
      expect(raw.source.warnings.some((w) => w.includes("select '*' was refused"))).toBe(true);
    } finally {
      mode.starRefused = false;
    }
  });

  it('finds records under any envelope and ignores reference-only replies', () => {
    expect(extractPage({ recordReferences: [{ objectNameSingular: 'a', recordId: '1', displayName: 'x' }], result: { records: [{ id: '1', name: 'x' }] } }).rows).toEqual([{ id: '1', name: 'x' }]);
    expect(extractPage({ recordReferences: [{ objectNameSingular: 'a', recordId: '1', displayName: 'x' }] }).rows).toEqual([]);
    expect(extractPage(JSON.stringify({ data: { edges: [{ node: { id: '2' } }] } })).rows).toEqual([{ id: '2' }]);
  });

  it('never falls back to other tables: a missing or empty niko table stops the load with an error', async () => {
    const saved = tables.find_many_arc_accounts;
    try {
      tables.find_many_arc_accounts = [];
      await expect(loadErpData(new McpClient(url, 'test-token'))).rejects.toThrow(/ARC Account - niko \(find_many_arc_accounts\) has no records/);
      delete tables.find_many_arc_accounts;
      await expect(loadErpData(new McpClient(url, 'test-token'))).rejects.toThrow(/ERP has no find_many_arc_accounts tool/);
    } finally {
      tables.find_many_arc_accounts = saved;
    }
    const raw = await loadErpData(new McpClient(url, 'test-token'));
    expect(raw.source.label).not.toMatch(/_og/);
  });

  it('fails clearly when the key is missing', () => {
    expect(() => new McpClient(url, '')).toThrow(/AGENTIC_ERP_TOKEN/);
  });
});
