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
 * Repository: the only place that reads stored data.
 * Today it reads the PILOT JSON files; later this module is swapped for Airgen ERP reads
 * without touching the measures, controllers or schema.
 */
const dataDir = process.env.ARC_DATA_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(dataDir, file), 'utf8')) as T;
}

export interface Repository {
  config: ModelConfig;
  opportunities: Opportunity[];
  goals: Goal[];
  clientManagers: ClientManager[];
  statusRules: StatusRule[];
  exceptionRules: ExceptionRule[];
  isMappedManager(name: string): boolean;
  statusRule(statusReason: string): StatusRule | undefined;
}

export function loadRepository(): Repository {
  const config = readJson<ModelConfig>('config.json');
  const records = readJson<OpportunityRecord[]>('opportunities.json');
  const goals = readJson<Goal[]>('goals.json');
  const clientManagers = readJson<ClientManager[]>('client-managers.json');
  const statusRules = readJson<StatusRule[]>('status-rules.json');
  const exceptionRules = readJson<ExceptionRule[]>('exception-rules.json');

  const managerNames = new Set(clientManagers.map((m) => m.name));
  const rulesByStatus = new Map(statusRules.map((r) => [r.statusReason, r]));

  // Join key is the CRM GUID; duplicated business IDs are expected and kept.
  const seen = new Set<string>();
  const opportunities: Opportunity[] = [];
  for (const r of records) {
    if (seen.has(r.guid)) continue;
    seen.add(r.guid);
    const rule = rulesByStatus.get(r.statusReason);
    opportunities.push({
      ...r,
      group: rule ? rule.group : 'EXCLUDED', // an unknown status is never counted
      clientManagerMapped: managerNames.has(r.clientManager),
    });
  }

  return {
    config,
    opportunities,
    goals,
    clientManagers,
    statusRules,
    exceptionRules,
    isMappedManager: (name) => managerNames.has(name),
    statusRule: (s) => rulesByStatus.get(s),
  };
}

let cached: Repository | null = null;
export function repository(): Repository {
  if (!cached) cached = loadRepository();
  return cached;
}
