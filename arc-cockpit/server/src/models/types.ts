/**
 * Domain types for the governed analytics model.
 * These mirror the Airgen custom objects; field names follow the BRD canonical mapping.
 */

export type StatusGroup = 'WON' | 'LOST' | 'OPEN' | 'EXCLUDED';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type Severity = 'HIGH' | 'MEDIUM';

/** One row exactly as it arrives from the CRM export (keyed by CRM GUID). */
export interface OpportunityRecord {
  guid: string;
  opportunityId: string;
  account: string;
  clientManager: string; // business CM (emitac_clientmanager), never the record owner
  owner: string | null; // CRM record owner, kept for transparency only
  createdOn: string | null; // ISO date
  estimatedClose: string | null;
  actualClose: string | null;
  statusReason: string;
  stage: string;
  forecastCategory: string | null;
  probability: number | null; // null = not recorded, never defaulted
  estimatedGP: number | null; // estimatedvalue is GP, not revenue
  actualGP: number | null; // emitac_actualgp
  vertical: string | null;
  lossReason?: string | null; // only when the source records it
  competitor?: string | null;
}

/** An opportunity after the governed status and manager rules are applied. */
export interface Opportunity extends OpportunityRecord {
  group: StatusGroup;
  clientManagerMapped: boolean;
}

export interface Goal {
  goalId: string;
  owner: string;
  metric: 'Actual GP' | 'Pre-Sales Actual GP';
  fiscalYear: number;
  quarter: Quarter;
  targetAED: number;
  source: string;
}

export interface ClientManager {
  name: string;
  team: string;
  active: boolean;
}

export interface StatusRule {
  statusReason: string;
  group: StatusGroup;
  countsAsWonGP: boolean;
  openForecast: boolean;
  winRateDenominator: boolean;
  note: string;
}

export interface ExceptionRule {
  id: string;
  name: string;
  sourceField: string;
  severity: Severity;
  appliesTo: string;
}

export interface ModelConfig {
  asOf: string;
  source: string;
  fiscalYear: number;
  fiscalYearStartMonth: number;
  currency: string;
}

export interface Filters {
  period: string;
  clientManager?: string | null;
  vertical?: string | null;
  search?: string | null;
}

export interface Period {
  id: string;
  label: string;
  short: string;
  start: string; // inclusive ISO date
  end: string; // inclusive ISO date
  quarters: Quarter[];
}

/** Every figure carries its scope so the UI can print period, record count, exclusions and as-of. */
export interface Scope {
  periodLabel: string;
  governingDate: string;
  recordCount: number;
  exclusions: string[];
  asOf: string;
  note?: string | null;
}

export interface Measure {
  value: number;
  count: number;
  scope: Scope;
}

export interface Bucket {
  key: string;
  label: string;
  value: number;
  count: number;
  flag?: string | null;
}
