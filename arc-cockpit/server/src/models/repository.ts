import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type {
  ClientManager,
  ExceptionRule,
  Goal,
  ModelConfig,
  Opportunity,
  OpportunityRecord,
  StatusRule,
} from './types.js';

/**
 * Repository: the only place the rest of the server gets data from.
 * Two sources feed the same builder:
 *  - "file": the PILOT export JSON in /data (default, used by tests)
 *  - "airgen": live records read from the Airgen ERP over MCP (see models/erp)
 * Business rules (status rules, exception rules) always come from /data config files.
 */
export const dataDir = process.env.ARC_DATA_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');

export function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(dataDir, file), 'utf8')) as T;
}

export interface RawData {
  config: ModelConfig;
  records: OpportunityRecord[];
  goals: Goal[];
  clientManagers: ClientManager[];
  source: { kind: 'file' | 'airgen'; label: string; loadedAt: string; warnings: string[] };
}

export interface Repository {
  config: ModelConfig;
  opportunities: Opportunity[];
  goals: Goal[];
  clientManagers: ClientManager[];
  statusRules: StatusRule[];
  exceptionRules: ExceptionRule[];
  source: RawData['source'];
  /** True when any goal row is a sample value rather than an ARC figure. */
  hasSampleGoals: boolean;
  isMappedManager(name: string): boolean;
  statusRule(statusReason: string): StatusRule | undefined;
}

/** "In Progress", "IN_PROGRESS" and "in-progress" all compare equal. */
export const normaliseKey = (s: string | null | undefined) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export function buildRepository(raw: RawData): Repository {
  const statusRules = readJson<StatusRule[]>('status-rules.json');
  const exceptionRules = readJson<ExceptionRule[]>('exception-rules.json');
  const managerNames = new Set(raw.clientManagers.map((m) => m.name));
  const rulesByStatus = new Map(statusRules.map((r) => [normaliseKey(r.statusReason), r]));
  const warnings = [...raw.source.warnings];

  // Join key is the CRM GUID; duplicated business IDs are expected and kept.
  const seen = new Set<string>();
  const unknownStatuses = new Set<string>();
  const opportunities: Opportunity[] = [];
  for (const r of raw.records) {
    if (!r.guid || seen.has(r.guid)) continue;
    seen.add(r.guid);
    const rule = rulesByStatus.get(normaliseKey(r.statusReason));
    if (!rule) unknownStatuses.add(r.statusReason);
    opportunities.push({
      ...r,
      statusReason: rule ? rule.statusReason : r.statusReason,
      group: rule ? rule.group : 'EXCLUDED', // an unknown status is never counted
      clientManagerMapped: managerNames.has(r.clientManager),
    });
  }
  if (unknownStatuses.size) {
    warnings.push(`Status values with no rule (excluded from every KPI): ${[...unknownStatuses].join(', ')}. Add them to data/status-rules.json.`);
  }

  return {
    config: raw.config,
    opportunities,
    goals: raw.goals,
    clientManagers: raw.clientManagers,
    statusRules,
    exceptionRules,
    source: { ...raw.source, warnings },
    hasSampleGoals: raw.goals.some((g) => /sample/i.test(g.source)),
    isMappedManager: (name) => managerNames.has(name),
    statusRule: (s) => rulesByStatus.get(normaliseKey(s)),
  };
}

export function loadFileData(): RawData {
  return {
    config: readJson<ModelConfig>('config.json'),
    records: readJson<OpportunityRecord[]>('opportunities.json'),
    goals: readJson<Goal[]>('goals.json'),
    clientManagers: readJson<ClientManager[]>('client-managers.json'),
    source: { kind: 'file', label: 'PILOT Dynamics exports, 22 Sep 2026', loadedAt: new Date().toISOString(), warnings: [] },
  };
}

let cached: Repository | null = null;

/** Synchronous access for controllers. Falls back to the file source if nothing was loaded yet (tests). */
export function repository(): Repository {
  if (!cached) cached = buildRepository(loadFileData());
  return cached;
}

export function setRepository(r: Repository) {
  cached = r;
}
