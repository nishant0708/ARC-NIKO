import { readJson, type RawData } from '../repository.js';
import type { ClientManager, Goal, ModelConfig, OpportunityRecord, Quarter } from '../types.js';
import { extractPage, isObj, McpClient } from './mcpClient.js';

/**
 * Live source: reads opportunities, GP targets, client managers and accounts from the Airgen ERP over MCP,
 * maps them to the cockpit's canonical fields (data/erp-mapping.json) and reports anything it could not map.
 * Values are copied, never invented: a missing field stays null and is shown as "not recorded".
 */

interface ObjectMapping {
  tool: string;
  table: string;
  fields: Record<string, string[]>;
}
interface Mapping {
  opportunities: ObjectMapping;
  goals: ObjectMapping;
  clientManagers: ObjectMapping;
  accounts: ObjectMapping;
}
type Row = Record<string, unknown>;

/** The ERP caps `limit` at 100. */
export const PAGE = 100;
const MAX_PAGES = 200;
/** Arguments of find_many tools that are not record fields. */
const CONTROL_ARGS = new Set(['limit', 'offset', 'orderBy', 'select', 'or', 'and', 'not', 'filter']);

/** A required ERP table is missing, unreadable or empty. The server refuses to start rather than show partial data. */
export class ErpTableError extends Error {}

export async function loadErpData(client = McpClient.fromEnv()): Promise<RawData> {
  const mapping = readJson<Mapping>('erp-mapping.json');
  const warnings: string[] = [];
  await client.connect();
  const available = toolNamesFrom(await client.catalog()).concat(client.listedToolNames());

  // Only the ARC niko tables are read. Each one is required: no fallback to other tables.
  const opp = await readRequired(client, mapping.opportunities, available, warnings);
  const goal = await readRequired(client, mapping.goals, available, warnings);
  const cm = await readRequired(client, mapping.clientManagers, available, warnings);
  const acc = await readRequired(client, mapping.accounts, available, warnings);

  // ----- lookups: ids and codes -> names
  const cmf = mapping.clientManagers.fields;
  const cmRows = cm.rows.filter((r) => pick(r, cmf.isTest) !== true);
  const cmByKey = lookup(cmRows, cmf.keys, (r) => text(pick(r, cmf.name)));
  const af = mapping.accounts.fields;
  const accByKey = lookup(acc.rows, af.keys, (r) => r);
  const resolveCm = (v: unknown) => resolve(v, cmByKey);

  // ----- opportunities
  const om = mapping.opportunities.fields;
  const records: OpportunityRecord[] = opp.rows.map((r) => {
    const accountRaw = pick(r, om.account);
    const account = accountRef(accountRaw, accByKey);
    return {
      guid: text(pick(r, om.guid)) ?? text(r.id) ?? '',
      opportunityId: text(pick(r, om.opportunityId)) ?? '',
      account: (account ? text(pick(account, af.name)) : null) ?? text(accountRaw) ?? 'Not recorded',
      clientManager: resolveCm(pick(r, om.clientManager)) ?? 'Not recorded',
      owner: text(pick(r, om.owner)),
      createdOn: date(pick(r, om.createdOn)),
      estimatedClose: date(pick(r, om.estimatedClose)),
      actualClose: date(pick(r, om.actualClose)),
      statusReason: text(pick(r, om.statusReason)) ?? 'Not recorded',
      stage: text(pick(r, om.stage)) ?? 'Not recorded',
      forecastCategory: text(pick(r, om.forecastCategory)),
      probability: num(pick(r, om.probability)),
      estimatedGP: money(pick(r, om.estimatedGP)),
      actualGP: money(pick(r, om.actualGP)),
      vertical: text(pick(r, om.vertical)) ?? (account ? text(pick(account, af.vertical)) : null),
      lossReason: text(pick(r, om.lossReason)),
      competitor: text(pick(r, om.competitor)),
    };
  });
  warnings.push(...unmapped('Opportunities', opp.tool, opp.rows, om, ['guid', 'clientManager', 'statusReason', 'estimatedGP', 'actualGP', 'estimatedClose', 'actualClose']));
  const guids = new Set<string>();
  const dupes = records.filter((o) => (guids.has(o.guid) ? true : (guids.add(o.guid), false))).length;
  if (dupes) warnings.push(`${dupes} opportunities share a GUID with another record; check ${opp.tool}.`);

  // ----- goals
  const gm = mapping.goals.fields;
  const goals: Goal[] = [];
  const skipped: string[] = [];
  for (const r of goal.rows) {
    const name = text(pick(r, gm.name)) ?? '';
    const metricRaw = text(pick(r, gm.metric)) ?? name;
    const quarter = quarterOf(text(pick(r, gm.quarter))) ?? quarterOf(name) ?? quarterOfDate(date(pick(r, gm.goalStart)));
    const year = yearOf(pick(r, gm.fiscalYear)) ?? yearOf(name) ?? yearOf(date(pick(r, gm.goalStart)));
    const target = money(pick(r, gm.targetAED));
    const ownerRaw = resolveCm(pick(r, gm.owner));
    // an unresolved code (CM-07, a uuid) is not a name: use the name in the goal title instead
    const owner = cleanOwner(ownerRaw && !looksLikeCode(ownerRaw) ? ownerRaw : (ownerFromName(name) ?? ownerRaw));
    if (!quarter || !year || target === null || !owner) {
      const missing = [!quarter && 'quarter', !year && 'fiscal year', target === null && 'target', !owner && 'owner'].filter(Boolean).join(', ');
      skipped.push(`${name || text(r.id) || 'unnamed'} (no ${missing})`);
      continue;
    }
    goals.push({
      goalId: text(pick(r, gm.guid)) ?? text(r.id) ?? `${owner}-${year}-${quarter}`,
      owner,
      metric: /pre[\s_-]*sales/i.test(metricRaw) || /pre[\s_-]*sales/i.test(name) ? 'Pre-Sales Actual GP' : 'Actual GP',
      fiscalYear: year,
      quarter,
      targetAED: target,
      source: text(pick(r, gm.source)) ?? `Airgen ERP · ${goal.tool}`,
    });
  }
  if (skipped.length) warnings.push(`${skipped.length} GP target rows skipped: ${skipped.slice(0, 5).join('; ')}${skipped.length > 5 ? '; …' : ''}.`);
  warnings.push(...unmapped('GP targets', goal.tool, goal.rows, gm, ['targetAED', 'quarter', 'fiscalYear']));
  if (!goals.length) throw new ErpTableError(`${mapping.goals.table} (${goal.tool}): none of its ${goal.rows.length} rows has an owner, quarter, fiscal year and target.`);

  // ----- client managers: the ERP table only
  const clientManagers: ClientManager[] = cmRows
    .map((r) => ({
      name: text(pick(r, cmf.name)) ?? '',
      team: text(pick(r, cmf.team)) ?? 'Sales',
      active: !/inactive|disabled|left/i.test(text(pick(r, cmf.status)) ?? ''),
    }))
    .filter((m) => m.name);
  if (!clientManagers.length) throw new ErpTableError(`${mapping.clientManagers.table} (${cm.tool}): no row has a name.`);

  const asOf = process.env.ERP_AS_OF ?? new Date().toISOString().slice(0, 10);
  const config: ModelConfig = {
    asOf,
    source: 'Airgen ERP (live)',
    fiscalYear: Number(process.env.ERP_FISCAL_YEAR ?? asOf.slice(0, 4)),
    fiscalYearStartMonth: 1,
    currency: 'AED',
  };

  const used = [opp.tool, goal.tool, cm.tool, acc.tool].map((t) => t.replace(/^find_many_/, ''));
  console.log(`[erp] tables: ${used.join(', ')}`);
  return {
    config,
    records,
    goals,
    clientManagers,
    source: { kind: 'airgen', label: `Airgen ERP · ${used.join(', ')}`, loadedAt: new Date().toISOString(), warnings },
  };
}

// ---------- reading ----------

/** Reads one required table in full. Missing, unreadable or empty -> ErpTableError. */
async function readRequired(client: McpClient, m: ObjectMapping, available: string[], warnings: string[]): Promise<{ tool: string; rows: Row[] }> {
  const { tool, table } = m;
  if (available.length && !available.includes(tool)) throw new ErpTableError(`${table}: the ERP has no ${tool} tool. Check the table exists and the API key's role can read it.`);
  let rows: Row[];
  try {
    rows = await readAll(client, tool, warnings);
  } catch (e) {
    throw new ErpTableError(`${table} (${tool}) could not be read: ${(e as Error).message.slice(0, 300)}`);
  }
  if (!rows.length) throw new ErpTableError(`${table} (${tool}) has no records.`);
  return { tool, rows };
}

/** Pages through a find_many tool (limit 100). Selects every field ('*'); falls back to the schema's field list. */
export async function readAll(client: McpClient, tool: string, warnings: string[]): Promise<Row[]> {
  let select: string[] = ['*'];
  const out: Row[] = [];
  let firstId: unknown = undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    let result: ReturnType<typeof extractPage> | null = null;
    for (let attempt = 0; result === null; attempt++) {
      try {
        result = extractPage(await client.run(tool, { limit: PAGE, offset: page * PAGE, select }));
      } catch (e) {
        const msg = (e as Error).message;
        if (select[0] === '*') {
          // '*' not supported: ask the ERP for the field list instead
          const fields = fieldNamesFromLearn(await client.learn([tool]).catch(() => null), tool);
          if (!fields?.length) throw e;
          select = fields;
          warnings.push(`${tool}: select '*' was refused; requested the ${fields.length} fields from its schema.`);
          continue;
        }
        // drop fields the ERP rejects and retry, at most once per field
        const bad = select.filter((f) => f !== 'id' && new RegExp(`["'\`\\s(\\\\]${escapeRe(f)}["'\`\\s),.:\\\\]`).test(` ${msg} `));
        if (!bad.length || bad.length >= select.length || attempt > select.length) throw e;
        select = select.filter((f) => !bad.includes(f));
        warnings.push(`${tool}: the ERP rejected field(s) ${bad.join(', ')}; continued without them.`);
      }
    }
    const { rows, hasNextPage, total } = result;
    if (page > 0 && rows.length && rows[0].id !== undefined && rows[0].id === firstId) break; // offset ignored: stop, do not loop
    if (page === 0) firstId = rows[0]?.id;
    out.push(...rows);
    if (hasNextPage === false || rows.length < PAGE || (total !== null && out.length >= total)) break;
    if (page === MAX_PAGES - 1) warnings.push(`${tool}: stopped after ${out.length} records (page limit).`);
  }
  return out;
}

// ---------- tool and field resolution ----------

/**
 * Field names of a find_many tool from a learn_tools reply: the `select` enum if there is one,
 * otherwise the filter arguments in its input schema (Twenty exposes one filter per field).
 */
export function fieldNamesFromLearn(payload: unknown, tool: string): string[] | null {
  let found: string[] | null = null;
  const strings = (v: unknown): string[] | null =>
    Array.isArray(v) && v.length && v.every((x) => typeof x === 'string') ? (v as string[]) : Array.isArray(v) && v.length && v.every((x) => isObj(x) && typeof x.name === 'string') ? v.map((x) => (x as { name: string }).name) : null;
  const walk = (v: unknown, inTool: boolean) => {
    if (found) return;
    if (typeof v === 'string') {
      try {
        walk(JSON.parse(v), inTool);
      } catch {
        /* plain text */
      }
      return;
    }
    if (Array.isArray(v)) return v.forEach((x) => walk(x, inTool));
    if (!isObj(v)) return;
    const here = inTool || v.name === tool || v.toolName === tool;
    if (isObj(v.select)) {
      const sel = v.select;
      found = strings(isObj(sel.items) ? sel.items.enum : undefined) ?? strings(sel.enum);
      if (found) return;
    }
    if (here && isObj(v.inputSchema) && isObj(v.inputSchema.properties)) {
      const names = Object.keys(v.inputSchema.properties).filter((k) => !CONTROL_ARGS.has(k));
      if (names.length) {
        const props = v.inputSchema.properties;
        const selectEnum = isObj(props.select) ? strings(isObj(props.select.items) ? props.select.items.enum : props.select.enum) : null;
        found = selectEnum ?? ['id', ...names];
        return;
      }
    }
    for (const k of ['availableFields', 'selectableFields', 'fields', 'fieldNames']) {
      const list = strings(v[k]);
      if (list && here) {
        found = list;
        return;
      }
    }
    Object.values(v).forEach((x) => walk(x, here));
  };
  walk(payload, false);
  return found;
}

export function toolNamesFrom(catalog: unknown): string[] {
  const names = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (isObj(v)) {
      if (typeof v.name === 'string') names.add(v.name);
      Object.values(v).forEach(walk);
    } else if (typeof v === 'string' && /^find_(many|one)_/.test(v)) names.add(v);
  };
  walk(catalog);
  return [...names];
}

function get(r: Row, path: string): unknown {
  return path.split('.').reduce<unknown>((v, k) => (isObj(v) ? v[k] : undefined), r);
}

function pick(r: Row, paths: string[] = []): unknown {
  for (const p of paths) {
    const v = get(r, p);
    if (v !== undefined && v !== null && v !== '' && !(isObj(v) && isEmptyValue(v))) return v;
  }
  return null;
}

/** {amountMicros: null}, {id: null, label: null} and similar carry no value. */
const isEmptyValue = (v: Record<string, unknown>) => Object.values(v).every((x) => x === null || x === undefined || x === '' || (typeof x === 'string' && /^[A-Z]{3}$/.test(x)));

function lookup<T>(rows: Row[], keyFields: string[] = [], value: (r: Row) => T | null): Map<string, T> {
  const map = new Map<string, T>();
  for (const r of rows) {
    const v = value(r);
    if (v === null) continue;
    for (const k of keyFields) {
      const key = text(get(r, k));
      if (key) map.set(key.toLowerCase(), v);
    }
  }
  return map;
}

/** A relation summary is read by its label; a bare id or code is looked up; anything else is taken as the name. */
function resolve(v: unknown, map: Map<string, string>): string | null {
  if (isObj(v) && typeof v.id === 'string' && map.has(v.id.toLowerCase())) return map.get(v.id.toLowerCase())!;
  const t = text(v);
  if (!t) return null;
  return map.get(t.toLowerCase()) ?? t;
}

function accountRef(v: unknown, map: Map<string, Row>): Row | null {
  const id = isObj(v) && typeof v.id === 'string' ? v.id : text(v);
  return id ? (map.get(id.toLowerCase()) ?? null) : null;
}

function unmapped(object: string, tool: string | null, rows: Row[], fields: Record<string, string[]>, important: string[]): string[] {
  if (!tool || !rows.length) return [];
  const missing = important.filter((f) => !rows.some((r) => pick(r, fields[f]) !== null));
  return missing.length
    ? [`${object} (${tool}): no value found for ${missing.join(', ')} (looked for ${missing.map((f) => fields[f].join('/')).join('; ')}). Fill the field in the ERP or edit data/erp-mapping.json.`]
    : [];
}

// ---------- value normalisation ----------

function text(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (isObj(v)) {
    if (typeof v.firstName === 'string' || typeof v.lastName === 'string') return [v.firstName, v.lastName].filter(Boolean).join(' ').trim() || null;
    for (const k of ['label', 'name', 'displayName', 'value', 'primaryLinkUrl']) if (v[k] !== undefined && v[k] !== null) return text(v[k]);
  }
  return null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Twenty currency fields arrive as { amountMicros, currencyCode }; plain number fields as numbers. */
function money(v: unknown): number | null {
  if (isObj(v)) {
    if ('amountMicros' in v) return v.amountMicros === null || v.amountMicros === undefined ? null : Number(v.amountMicros) / 1_000_000;
    if ('amount' in v) return num(v.amount);
    return null; // an object we do not understand is never read as a number
  }
  return num(v);
}

function date(v: unknown): string | null {
  const s = text(v);
  return s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

function quarterOf(s: string | null): Quarter | null {
  const m = s?.match(/(?:q|quarter)[\s_-]*([1-4])\b/i);
  return m ? (`Q${m[1]}` as Quarter) : null;
}

function quarterOfDate(d: string | null): Quarter | null {
  return d ? (`Q${Math.floor((Number(d.slice(5, 7)) - 1) / 3) + 1}` as Quarter) : null;
}

function yearOf(v: unknown): number | null {
  const m = String(v ?? '').replace(/,/g, '').match(/(20\d{2})/);
  return m ? Number(m[1]) : null;
}

/** "Q3-2026: Feras Fares | CM Actual GP | Quarter 3" -> "Feras Fares" */
function ownerFromName(name: string): string | null {
  const m = name.match(/^[^:]*:\s*([^|]+)/);
  return m ? m[1].trim() || null : null;
}

/** "Mohammed Abdul Lateef-Pre-Sales" -> "Mohammed Abdul Lateef" (the metric carries Pre-Sales). */
function cleanOwner(owner: string | null): string | null {
  return owner ? owner.replace(/[\s-]*pre[\s_-]*sales$/i, '').trim() || null : null;
}

const looksLikeCode = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s) || (!/\s/.test(s) && /\d/.test(s));

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
