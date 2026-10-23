/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Bucket = {
  __typename?: 'Bucket';
  count: Scalars['Int']['output'];
  flag?: Maybe<Scalars['String']['output']>;
  key: Scalars['String']['output'];
  label: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type ClientManagerRow = {
  __typename?: 'ClientManagerRow';
  achieved: Scalars['Float']['output'];
  exceptionCount: Scalars['Int']['output'];
  gap?: Maybe<Scalars['Float']['output']>;
  lost: Scalars['Int']['output'];
  mapped: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  openGP: Scalars['Float']['output'];
  opportunityCount: Scalars['Int']['output'];
  target?: Maybe<Scalars['Float']['output']>;
  winRate?: Maybe<Scalars['Float']['output']>;
  won: Scalars['Int']['output'];
};

export type ClientManagersView = {
  __typename?: 'ClientManagersView';
  opportunityCount: Scalars['Int']['output'];
  ownerDiffersCount: Scalars['Int']['output'];
  rows: Array<ClientManagerRow>;
  scope: Scope;
};

export type Cm360View = {
  __typename?: 'Cm360View';
  achieved: Measure;
  asOf: Scalars['String']['output'];
  clientManager: Scalars['String']['output'];
  deals: Array<Opportunity>;
  gap: Gap;
  /** value = lost-at-estimate GP (an estimate, never realised GP); count = lost deals */
  lost: Measure;
  mapped: Scalars['Boolean']['output'];
  medianSalesCycleDays?: Maybe<Scalars['Float']['output']>;
  openForecast: Measure;
  opportunityCount: Scalars['Int']['output'];
  periodLabel: Scalars['String']['output'];
  salesCycleSample: Scalars['Int']['output'];
  target: TargetMeasure;
  trend: Array<TrendPoint>;
  weightedOpen: Measure;
  winRate?: Maybe<Scalars['Float']['output']>;
  winRateExcludedCount: Scalars['Int']['output'];
  winRateTreatment: Scalars['String']['output'];
  won: Measure;
};

export type DrillGroup =
  | 'CLOSE_MONTH'
  | 'FORECAST_CATEGORY'
  | 'MONTH'
  | 'OUTCOME'
  | 'STAGE'
  | 'VERTICAL';

export type DrillInput = {
  bucket?: InputMaybe<Scalars['String']['input']>;
  filters: FiltersInput;
  groupBy?: InputMaybe<DrillGroup>;
  measure: DrillMeasure;
};

export type DrillMeasure =
  | 'ACHIEVED_GP'
  | 'CLOSED_DEALS'
  | 'LOST_DEALS'
  | 'OPEN_FORECAST_GP'
  | 'OVERDUE_OPEN'
  | 'UNDATED_OPEN'
  | 'WEIGHTED_OPEN_GP';

export type DrillResult = {
  __typename?: 'DrillResult';
  amountLabel: Scalars['String']['output'];
  governingDate: Scalars['String']['output'];
  rows: Array<DrillRow>;
  scope: Scope;
  title: Scalars['String']['output'];
  total: Scalars['Float']['output'];
};

/** One record behind a figure, with the amount and governing date that the figure used. */
export type DrillRow = {
  __typename?: 'DrillRow';
  amount?: Maybe<Scalars['Float']['output']>;
  governingDateValue?: Maybe<Scalars['String']['output']>;
  opportunity: Opportunity;
};

export type ExceptionItem = {
  __typename?: 'ExceptionItem';
  asOf: Scalars['String']['output'];
  gpExposure?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  opportunity: Opportunity;
  rule: ExceptionRule;
  severity: Severity;
};

export type ExceptionRule = {
  __typename?: 'ExceptionRule';
  appliesTo: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  severity: Severity;
  sourceField: Scalars['String']['output'];
};

export type ExceptionsView = {
  __typename?: 'ExceptionsView';
  asOf: Scalars['String']['output'];
  byRule: Array<RuleCount>;
  bySeverity: Array<SeverityCount>;
  filteredTotal: Scalars['Int']['output'];
  gpExposure: Scalars['Float']['output'];
  items: Array<ExceptionItem>;
  rules: Array<ExceptionRule>;
  total: Scalars['Int']['output'];
};

export type Executive = {
  __typename?: 'Executive';
  achieved: Measure;
  achievedByMonth: Array<MonthPoint>;
  achievedByVertical: Array<Bucket>;
  asOf: Scalars['String']['output'];
  closedOutcomes: Array<Bucket>;
  gap: Gap;
  openByCategory: Array<Bucket>;
  openByCloseMonth: Array<Bucket>;
  openForecast: Measure;
  overdue: Measure;
  periodLabel: Scalars['String']['output'];
  target: TargetMeasure;
  undated: Measure;
  warnings: Array<Warning>;
};

export type FiltersInput = {
  clientManager?: InputMaybe<Scalars['String']['input']>;
  /** Fiscal period id, e.g. 2026-Q3 or 2026-FY */
  period: Scalars['String']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  vertical?: InputMaybe<Scalars['String']['input']>;
};

export type Gap = {
  __typename?: 'Gap';
  attainment?: Maybe<Scalars['Float']['output']>;
  exceeded: Scalars['Boolean']['output'];
  /** Target minus achieved; negative means exceeded. Null without a target. */
  value?: Maybe<Scalars['Float']['output']>;
};

export type GoalRow = {
  __typename?: 'GoalRow';
  fiscalYear: Scalars['Int']['output'];
  goalId: Scalars['String']['output'];
  metric: Scalars['String']['output'];
  owner: Scalars['String']['output'];
  quarter: Scalars['String']['output'];
  source: Scalars['String']['output'];
  targetAED: Scalars['Float']['output'];
};

export type ManagerOption = {
  __typename?: 'ManagerOption';
  mapped: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
};

export type Measure = {
  __typename?: 'Measure';
  count: Scalars['Int']['output'];
  scope: Scope;
  value: Scalars['Float']['output'];
};

export type MonthPoint = {
  __typename?: 'MonthPoint';
  afterAsOf: Scalars['Boolean']['output'];
  count: Scalars['Int']['output'];
  inPeriod: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  month: Scalars['String']['output'];
  value: Scalars['Float']['output'];
};

export type Opportunity = {
  __typename?: 'Opportunity';
  account: Scalars['String']['output'];
  actualClose?: Maybe<Scalars['String']['output']>;
  actualGP?: Maybe<Scalars['Float']['output']>;
  clientManager: Scalars['String']['output'];
  clientManagerMapped: Scalars['Boolean']['output'];
  competitor: RecordedText;
  createdOn?: Maybe<Scalars['String']['output']>;
  estimatedClose?: Maybe<Scalars['String']['output']>;
  estimatedGP?: Maybe<Scalars['Float']['output']>;
  flags: Array<Scalars['String']['output']>;
  forecastCategory?: Maybe<Scalars['String']['output']>;
  guid: Scalars['ID']['output'];
  lossReason: RecordedText;
  opportunityId: Scalars['String']['output'];
  owner?: Maybe<Scalars['String']['output']>;
  probability?: Maybe<Scalars['Float']['output']>;
  salesCycleDays?: Maybe<Scalars['Int']['output']>;
  stage: Scalars['String']['output'];
  stageAtLoss: RecordedText;
  statusGroup: StatusGroup;
  statusReason: Scalars['String']['output'];
  vertical?: Maybe<Scalars['String']['output']>;
};

export type Options = {
  __typename?: 'Options';
  asOf: Scalars['String']['output'];
  asOfIso: Scalars['String']['output'];
  clientManagers: Array<ManagerOption>;
  currency: Scalars['String']['output'];
  defaultPeriod: Scalars['String']['output'];
  periods: Array<PeriodOption>;
  source: Scalars['String']['output'];
  verticals: Array<Scalars['String']['output']>;
};

export type PeriodOption = {
  __typename?: 'PeriodOption';
  id: Scalars['String']['output'];
  label: Scalars['String']['output'];
};

export type PipelineView = {
  __typename?: 'PipelineView';
  byCategory: Array<Bucket>;
  byCloseMonth: Array<Bucket>;
  byStage: Array<Bucket>;
  missingProbability: Scalars['Int']['output'];
  openGP: Measure;
  opportunities: Array<Opportunity>;
  overdue: Measure;
  undated: Measure;
  weightedOpenGP: Measure;
};

/**
 * ARC cockpit read API. Mirrors the shape the Airgen ERP GraphQL API will expose.
 * All KPI values are computed by the server's governed model; the client only displays them.
 */
export type Query = {
  __typename?: 'Query';
  clientManagers: ClientManagersView;
  cm360?: Maybe<Cm360View>;
  drill: DrillResult;
  exceptions: ExceptionsView;
  executive: Executive;
  opportunity?: Maybe<Opportunity>;
  options: Options;
  pipeline: PipelineView;
  targets: TargetDrill;
};


/**
 * ARC cockpit read API. Mirrors the shape the Airgen ERP GraphQL API will expose.
 * All KPI values are computed by the server's governed model; the client only displays them.
 */
export type QueryClientManagersArgs = {
  filters: FiltersInput;
};


/**
 * ARC cockpit read API. Mirrors the shape the Airgen ERP GraphQL API will expose.
 * All KPI values are computed by the server's governed model; the client only displays them.
 */
export type QueryCm360Args = {
  filters: FiltersInput;
};


/**
 * ARC cockpit read API. Mirrors the shape the Airgen ERP GraphQL API will expose.
 * All KPI values are computed by the server's governed model; the client only displays them.
 */
export type QueryDrillArgs = {
  input: DrillInput;
};


/**
 * ARC cockpit read API. Mirrors the shape the Airgen ERP GraphQL API will expose.
 * All KPI values are computed by the server's governed model; the client only displays them.
 */
export type QueryExceptionsArgs = {
  filters: FiltersInput;
  ruleId?: InputMaybe<Scalars['String']['input']>;
  severity?: InputMaybe<Severity>;
};


/**
 * ARC cockpit read API. Mirrors the shape the Airgen ERP GraphQL API will expose.
 * All KPI values are computed by the server's governed model; the client only displays them.
 */
export type QueryExecutiveArgs = {
  filters: FiltersInput;
};


/**
 * ARC cockpit read API. Mirrors the shape the Airgen ERP GraphQL API will expose.
 * All KPI values are computed by the server's governed model; the client only displays them.
 */
export type QueryOpportunityArgs = {
  guid: Scalars['ID']['input'];
};


/**
 * ARC cockpit read API. Mirrors the shape the Airgen ERP GraphQL API will expose.
 * All KPI values are computed by the server's governed model; the client only displays them.
 */
export type QueryPipelineArgs = {
  filters: FiltersInput;
};


/**
 * ARC cockpit read API. Mirrors the shape the Airgen ERP GraphQL API will expose.
 * All KPI values are computed by the server's governed model; the client only displays them.
 */
export type QueryTargetsArgs = {
  filters: FiltersInput;
};

/** How a field is known for this record. The UI never invents a value. */
export type RecordStatus =
  | 'NOT_APPLICABLE'
  | 'NOT_PRODUCIBLE'
  | 'NOT_RECORDED'
  | 'RECORDED';

export type RecordedText = {
  __typename?: 'RecordedText';
  status: RecordStatus;
  value?: Maybe<Scalars['String']['output']>;
};

export type RuleCount = {
  __typename?: 'RuleCount';
  count: Scalars['Int']['output'];
  rule: ExceptionRule;
};

export type Scope = {
  __typename?: 'Scope';
  asOf: Scalars['String']['output'];
  exclusions: Array<Scalars['String']['output']>;
  governingDate: Scalars['String']['output'];
  note?: Maybe<Scalars['String']['output']>;
  periodLabel: Scalars['String']['output'];
  recordCount: Scalars['Int']['output'];
};

export type Severity =
  | 'HIGH'
  | 'MEDIUM';

export type SeverityCount = {
  __typename?: 'SeverityCount';
  count: Scalars['Int']['output'];
  severity: Severity;
};

export type StatusGroup =
  | 'EXCLUDED'
  | 'LOST'
  | 'OPEN'
  | 'WON';

export type TargetDrill = {
  __typename?: 'TargetDrill';
  rows: Array<GoalRow>;
  scope: Scope;
  total?: Maybe<Scalars['Float']['output']>;
};

export type TargetMeasure = {
  __typename?: 'TargetMeasure';
  goalCount: Scalars['Int']['output'];
  managerCount: Scalars['Int']['output'];
  scope: Scope;
  /** Null when no goal record exists for the scope */
  value?: Maybe<Scalars['Float']['output']>;
};

export type TrendPoint = {
  __typename?: 'TrendPoint';
  afterAsOf: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  lost: Scalars['Int']['output'];
  month: Scalars['String']['output'];
  won: Scalars['Int']['output'];
};

export type Warning = {
  __typename?: 'Warning';
  kind: Scalars['String']['output'];
  message: Scalars['String']['output'];
  title: Scalars['String']['output'];
};

export type ScopeFieldsFragment = { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null };

export type MeasureFieldsFragment = { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } };

export type BucketFieldsFragment = { __typename?: 'Bucket', key: string, label: string, value: number, count: number, flag?: string | null };

export type OpportunityFieldsFragment = { __typename?: 'Opportunity', guid: string, opportunityId: string, account: string, clientManager: string, clientManagerMapped: boolean, owner?: string | null, createdOn?: string | null, estimatedClose?: string | null, actualClose?: string | null, statusReason: string, statusGroup: StatusGroup, stage: string, forecastCategory?: string | null, probability?: number | null, estimatedGP?: number | null, actualGP?: number | null, vertical?: string | null, salesCycleDays?: number | null, flags: Array<string>, lossReason: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, competitor: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, stageAtLoss: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus } };

export type OptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type OptionsQuery = { __typename?: 'Query', options: { __typename?: 'Options', asOf: string, asOfIso: string, source: string, currency: string, defaultPeriod: string, verticals: Array<string>, periods: Array<{ __typename?: 'PeriodOption', id: string, label: string }>, clientManagers: Array<{ __typename?: 'ManagerOption', name: string, mapped: boolean }> } };

export type ExecutiveQueryVariables = Exact<{
  filters: FiltersInput;
}>;


export type ExecutiveQuery = { __typename?: 'Query', executive: { __typename?: 'Executive', periodLabel: string, asOf: string, target: { __typename?: 'TargetMeasure', value?: number | null, managerCount: number, goalCount: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, achieved: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, gap: { __typename?: 'Gap', value?: number | null, exceeded: boolean, attainment?: number | null }, openForecast: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, undated: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, overdue: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, warnings: Array<{ __typename?: 'Warning', kind: string, title: string, message: string }>, achievedByMonth: Array<{ __typename?: 'MonthPoint', month: string, label: string, value: number, count: number, inPeriod: boolean, afterAsOf: boolean }>, openByCloseMonth: Array<{ __typename?: 'Bucket', key: string, label: string, value: number, count: number, flag?: string | null }>, achievedByVertical: Array<{ __typename?: 'Bucket', key: string, label: string, value: number, count: number, flag?: string | null }>, openByCategory: Array<{ __typename?: 'Bucket', key: string, label: string, value: number, count: number, flag?: string | null }>, closedOutcomes: Array<{ __typename?: 'Bucket', key: string, label: string, value: number, count: number, flag?: string | null }> } };

export type ClientManagersQueryVariables = Exact<{
  filters: FiltersInput;
}>;


export type ClientManagersQuery = { __typename?: 'Query', clientManagers: { __typename?: 'ClientManagersView', opportunityCount: number, ownerDiffersCount: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null }, rows: Array<{ __typename?: 'ClientManagerRow', name: string, mapped: boolean, target?: number | null, achieved: number, openGP: number, gap?: number | null, winRate?: number | null, won: number, lost: number, exceptionCount: number, opportunityCount: number }> } };

export type PipelineQueryVariables = Exact<{
  filters: FiltersInput;
}>;


export type PipelineQuery = { __typename?: 'Query', pipeline: { __typename?: 'PipelineView', missingProbability: number, openGP: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, weightedOpenGP: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, undated: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, overdue: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, byStage: Array<{ __typename?: 'Bucket', key: string, label: string, value: number, count: number, flag?: string | null }>, byCloseMonth: Array<{ __typename?: 'Bucket', key: string, label: string, value: number, count: number, flag?: string | null }>, byCategory: Array<{ __typename?: 'Bucket', key: string, label: string, value: number, count: number, flag?: string | null }>, opportunities: Array<{ __typename?: 'Opportunity', guid: string, opportunityId: string, account: string, clientManager: string, clientManagerMapped: boolean, owner?: string | null, createdOn?: string | null, estimatedClose?: string | null, actualClose?: string | null, statusReason: string, statusGroup: StatusGroup, stage: string, forecastCategory?: string | null, probability?: number | null, estimatedGP?: number | null, actualGP?: number | null, vertical?: string | null, salesCycleDays?: number | null, flags: Array<string>, lossReason: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, competitor: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, stageAtLoss: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus } }> } };

export type Cm360QueryVariables = Exact<{
  filters: FiltersInput;
}>;


export type Cm360Query = { __typename?: 'Query', cm360?: { __typename?: 'Cm360View', clientManager: string, mapped: boolean, opportunityCount: number, periodLabel: string, asOf: string, winRate?: number | null, winRateExcludedCount: number, winRateTreatment: string, medianSalesCycleDays?: number | null, salesCycleSample: number, target: { __typename?: 'TargetMeasure', value?: number | null, goalCount: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, achieved: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, gap: { __typename?: 'Gap', value?: number | null, exceeded: boolean, attainment?: number | null }, openForecast: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, weightedOpen: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, won: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, lost: { __typename?: 'Measure', value: number, count: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null } }, trend: Array<{ __typename?: 'TrendPoint', month: string, label: string, won: number, lost: number, afterAsOf: boolean }>, deals: Array<{ __typename?: 'Opportunity', guid: string, opportunityId: string, account: string, clientManager: string, clientManagerMapped: boolean, owner?: string | null, createdOn?: string | null, estimatedClose?: string | null, actualClose?: string | null, statusReason: string, statusGroup: StatusGroup, stage: string, forecastCategory?: string | null, probability?: number | null, estimatedGP?: number | null, actualGP?: number | null, vertical?: string | null, salesCycleDays?: number | null, flags: Array<string>, lossReason: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, competitor: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, stageAtLoss: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus } }> } | null };

export type ExceptionsQueryVariables = Exact<{
  filters: FiltersInput;
  severity?: InputMaybe<Severity>;
  ruleId?: InputMaybe<Scalars['String']['input']>;
}>;


export type ExceptionsQuery = { __typename?: 'Query', exceptions: { __typename?: 'ExceptionsView', asOf: string, total: number, filteredTotal: number, gpExposure: number, bySeverity: Array<{ __typename?: 'SeverityCount', severity: Severity, count: number }>, byRule: Array<{ __typename?: 'RuleCount', count: number, rule: { __typename?: 'ExceptionRule', id: string, name: string, sourceField: string, severity: Severity, appliesTo: string } }>, rules: Array<{ __typename?: 'ExceptionRule', id: string, name: string, severity: Severity }>, items: Array<{ __typename?: 'ExceptionItem', id: string, severity: Severity, gpExposure?: number | null, asOf: string, rule: { __typename?: 'ExceptionRule', id: string, name: string, sourceField: string }, opportunity: { __typename?: 'Opportunity', guid: string, opportunityId: string, account: string, clientManager: string, clientManagerMapped: boolean, owner?: string | null, createdOn?: string | null, estimatedClose?: string | null, actualClose?: string | null, statusReason: string, statusGroup: StatusGroup, stage: string, forecastCategory?: string | null, probability?: number | null, estimatedGP?: number | null, actualGP?: number | null, vertical?: string | null, salesCycleDays?: number | null, flags: Array<string>, lossReason: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, competitor: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, stageAtLoss: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus } } }> } };

export type DrillQueryVariables = Exact<{
  input: DrillInput;
}>;


export type DrillQuery = { __typename?: 'Query', drill: { __typename?: 'DrillResult', title: string, governingDate: string, amountLabel: string, total: number, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null }, rows: Array<{ __typename?: 'DrillRow', amount?: number | null, governingDateValue?: string | null, opportunity: { __typename?: 'Opportunity', guid: string, opportunityId: string, account: string, clientManager: string, clientManagerMapped: boolean, owner?: string | null, createdOn?: string | null, estimatedClose?: string | null, actualClose?: string | null, statusReason: string, statusGroup: StatusGroup, stage: string, forecastCategory?: string | null, probability?: number | null, estimatedGP?: number | null, actualGP?: number | null, vertical?: string | null, salesCycleDays?: number | null, flags: Array<string>, lossReason: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, competitor: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, stageAtLoss: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus } } }> } };

export type TargetsQueryVariables = Exact<{
  filters: FiltersInput;
}>;


export type TargetsQuery = { __typename?: 'Query', targets: { __typename?: 'TargetDrill', total?: number | null, scope: { __typename?: 'Scope', periodLabel: string, governingDate: string, recordCount: number, exclusions: Array<string>, asOf: string, note?: string | null }, rows: Array<{ __typename?: 'GoalRow', goalId: string, owner: string, quarter: string, fiscalYear: number, metric: string, targetAED: number, source: string }> } };

export type OpportunityQueryVariables = Exact<{
  guid: Scalars['ID']['input'];
}>;


export type OpportunityQuery = { __typename?: 'Query', opportunity?: { __typename?: 'Opportunity', guid: string, opportunityId: string, account: string, clientManager: string, clientManagerMapped: boolean, owner?: string | null, createdOn?: string | null, estimatedClose?: string | null, actualClose?: string | null, statusReason: string, statusGroup: StatusGroup, stage: string, forecastCategory?: string | null, probability?: number | null, estimatedGP?: number | null, actualGP?: number | null, vertical?: string | null, salesCycleDays?: number | null, flags: Array<string>, lossReason: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, competitor: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus }, stageAtLoss: { __typename?: 'RecordedText', value?: string | null, status: RecordStatus } } | null };

export const ScopeFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScopeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scope"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodLabel"}},{"kind":"Field","name":{"kind":"Name","value":"governingDate"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"exclusions"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]} as unknown as DocumentNode<ScopeFieldsFragment, unknown>;
export const MeasureFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeasureFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Measure"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScopeFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScopeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scope"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodLabel"}},{"kind":"Field","name":{"kind":"Name","value":"governingDate"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"exclusions"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]} as unknown as DocumentNode<MeasureFieldsFragment, unknown>;
export const BucketFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BucketFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Bucket"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]} as unknown as DocumentNode<BucketFieldsFragment, unknown>;
export const OpportunityFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OpportunityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Opportunity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"opportunityId"}},{"kind":"Field","name":{"kind":"Name","value":"account"}},{"kind":"Field","name":{"kind":"Name","value":"clientManager"}},{"kind":"Field","name":{"kind":"Name","value":"clientManagerMapped"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"createdOn"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedClose"}},{"kind":"Field","name":{"kind":"Name","value":"actualClose"}},{"kind":"Field","name":{"kind":"Name","value":"statusReason"}},{"kind":"Field","name":{"kind":"Name","value":"statusGroup"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"forecastCategory"}},{"kind":"Field","name":{"kind":"Name","value":"probability"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedGP"}},{"kind":"Field","name":{"kind":"Name","value":"actualGP"}},{"kind":"Field","name":{"kind":"Name","value":"vertical"}},{"kind":"Field","name":{"kind":"Name","value":"salesCycleDays"}},{"kind":"Field","name":{"kind":"Name","value":"flags"}},{"kind":"Field","name":{"kind":"Name","value":"lossReason"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"competitor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stageAtLoss"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<OpportunityFieldsFragment, unknown>;
export const OptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"asOfIso"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"defaultPeriod"}},{"kind":"Field","name":{"kind":"Name","value":"periods"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"clientManagers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mapped"}}]}},{"kind":"Field","name":{"kind":"Name","value":"verticals"}}]}}]}}]} as unknown as DocumentNode<OptionsQuery, OptionsQueryVariables>;
export const ExecutiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Executive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FiltersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"executive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodLabel"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"managerCount"}},{"kind":"Field","name":{"kind":"Name","value":"goalCount"}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScopeFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"achieved"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"gap"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"exceeded"}},{"kind":"Field","name":{"kind":"Name","value":"attainment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openForecast"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"undated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"overdue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"warnings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"kind"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}},{"kind":"Field","name":{"kind":"Name","value":"achievedByMonth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"inPeriod"}},{"kind":"Field","name":{"kind":"Name","value":"afterAsOf"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openByCloseMonth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BucketFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"achievedByVertical"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BucketFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openByCategory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BucketFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"closedOutcomes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BucketFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScopeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scope"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodLabel"}},{"kind":"Field","name":{"kind":"Name","value":"governingDate"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"exclusions"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeasureFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Measure"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScopeFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BucketFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Bucket"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}}]} as unknown as DocumentNode<ExecutiveQuery, ExecutiveQueryVariables>;
export const ClientManagersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ClientManagers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FiltersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clientManagers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScopeFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"opportunityCount"}},{"kind":"Field","name":{"kind":"Name","value":"ownerDiffersCount"}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"mapped"}},{"kind":"Field","name":{"kind":"Name","value":"target"}},{"kind":"Field","name":{"kind":"Name","value":"achieved"}},{"kind":"Field","name":{"kind":"Name","value":"openGP"}},{"kind":"Field","name":{"kind":"Name","value":"gap"}},{"kind":"Field","name":{"kind":"Name","value":"winRate"}},{"kind":"Field","name":{"kind":"Name","value":"won"}},{"kind":"Field","name":{"kind":"Name","value":"lost"}},{"kind":"Field","name":{"kind":"Name","value":"exceptionCount"}},{"kind":"Field","name":{"kind":"Name","value":"opportunityCount"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScopeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scope"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodLabel"}},{"kind":"Field","name":{"kind":"Name","value":"governingDate"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"exclusions"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]} as unknown as DocumentNode<ClientManagersQuery, ClientManagersQueryVariables>;
export const PipelineDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Pipeline"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FiltersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pipeline"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openGP"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weightedOpenGP"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"missingProbability"}},{"kind":"Field","name":{"kind":"Name","value":"undated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"overdue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"byStage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BucketFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"byCloseMonth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BucketFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"byCategory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"BucketFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"opportunities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OpportunityFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScopeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scope"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodLabel"}},{"kind":"Field","name":{"kind":"Name","value":"governingDate"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"exclusions"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeasureFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Measure"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScopeFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BucketFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Bucket"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"flag"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OpportunityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Opportunity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"opportunityId"}},{"kind":"Field","name":{"kind":"Name","value":"account"}},{"kind":"Field","name":{"kind":"Name","value":"clientManager"}},{"kind":"Field","name":{"kind":"Name","value":"clientManagerMapped"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"createdOn"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedClose"}},{"kind":"Field","name":{"kind":"Name","value":"actualClose"}},{"kind":"Field","name":{"kind":"Name","value":"statusReason"}},{"kind":"Field","name":{"kind":"Name","value":"statusGroup"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"forecastCategory"}},{"kind":"Field","name":{"kind":"Name","value":"probability"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedGP"}},{"kind":"Field","name":{"kind":"Name","value":"actualGP"}},{"kind":"Field","name":{"kind":"Name","value":"vertical"}},{"kind":"Field","name":{"kind":"Name","value":"salesCycleDays"}},{"kind":"Field","name":{"kind":"Name","value":"flags"}},{"kind":"Field","name":{"kind":"Name","value":"lossReason"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"competitor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stageAtLoss"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<PipelineQuery, PipelineQueryVariables>;
export const Cm360Document = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Cm360"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FiltersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cm360"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clientManager"}},{"kind":"Field","name":{"kind":"Name","value":"mapped"}},{"kind":"Field","name":{"kind":"Name","value":"opportunityCount"}},{"kind":"Field","name":{"kind":"Name","value":"periodLabel"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"goalCount"}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScopeFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"achieved"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"gap"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"exceeded"}},{"kind":"Field","name":{"kind":"Name","value":"attainment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"openForecast"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weightedOpen"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"won"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lost"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MeasureFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"winRate"}},{"kind":"Field","name":{"kind":"Name","value":"winRateExcludedCount"}},{"kind":"Field","name":{"kind":"Name","value":"winRateTreatment"}},{"kind":"Field","name":{"kind":"Name","value":"medianSalesCycleDays"}},{"kind":"Field","name":{"kind":"Name","value":"salesCycleSample"}},{"kind":"Field","name":{"kind":"Name","value":"trend"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"won"}},{"kind":"Field","name":{"kind":"Name","value":"lost"}},{"kind":"Field","name":{"kind":"Name","value":"afterAsOf"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deals"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OpportunityFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScopeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scope"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodLabel"}},{"kind":"Field","name":{"kind":"Name","value":"governingDate"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"exclusions"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MeasureFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Measure"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScopeFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OpportunityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Opportunity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"opportunityId"}},{"kind":"Field","name":{"kind":"Name","value":"account"}},{"kind":"Field","name":{"kind":"Name","value":"clientManager"}},{"kind":"Field","name":{"kind":"Name","value":"clientManagerMapped"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"createdOn"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedClose"}},{"kind":"Field","name":{"kind":"Name","value":"actualClose"}},{"kind":"Field","name":{"kind":"Name","value":"statusReason"}},{"kind":"Field","name":{"kind":"Name","value":"statusGroup"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"forecastCategory"}},{"kind":"Field","name":{"kind":"Name","value":"probability"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedGP"}},{"kind":"Field","name":{"kind":"Name","value":"actualGP"}},{"kind":"Field","name":{"kind":"Name","value":"vertical"}},{"kind":"Field","name":{"kind":"Name","value":"salesCycleDays"}},{"kind":"Field","name":{"kind":"Name","value":"flags"}},{"kind":"Field","name":{"kind":"Name","value":"lossReason"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"competitor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stageAtLoss"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<Cm360Query, Cm360QueryVariables>;
export const ExceptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Exceptions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FiltersInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"severity"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Severity"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ruleId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exceptions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"severity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"severity"}}},{"kind":"Argument","name":{"kind":"Name","value":"ruleId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ruleId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"filteredTotal"}},{"kind":"Field","name":{"kind":"Name","value":"gpExposure"}},{"kind":"Field","name":{"kind":"Name","value":"bySeverity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}},{"kind":"Field","name":{"kind":"Name","value":"byRule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"rule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceField"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"appliesTo"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"rules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"severity"}},{"kind":"Field","name":{"kind":"Name","value":"gpExposure"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"rule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"sourceField"}}]}},{"kind":"Field","name":{"kind":"Name","value":"opportunity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OpportunityFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OpportunityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Opportunity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"opportunityId"}},{"kind":"Field","name":{"kind":"Name","value":"account"}},{"kind":"Field","name":{"kind":"Name","value":"clientManager"}},{"kind":"Field","name":{"kind":"Name","value":"clientManagerMapped"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"createdOn"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedClose"}},{"kind":"Field","name":{"kind":"Name","value":"actualClose"}},{"kind":"Field","name":{"kind":"Name","value":"statusReason"}},{"kind":"Field","name":{"kind":"Name","value":"statusGroup"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"forecastCategory"}},{"kind":"Field","name":{"kind":"Name","value":"probability"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedGP"}},{"kind":"Field","name":{"kind":"Name","value":"actualGP"}},{"kind":"Field","name":{"kind":"Name","value":"vertical"}},{"kind":"Field","name":{"kind":"Name","value":"salesCycleDays"}},{"kind":"Field","name":{"kind":"Name","value":"flags"}},{"kind":"Field","name":{"kind":"Name","value":"lossReason"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"competitor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stageAtLoss"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ExceptionsQuery, ExceptionsQueryVariables>;
export const DrillDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Drill"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DrillInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"drill"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"governingDate"}},{"kind":"Field","name":{"kind":"Name","value":"amountLabel"}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScopeFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"governingDateValue"}},{"kind":"Field","name":{"kind":"Name","value":"opportunity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OpportunityFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScopeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scope"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodLabel"}},{"kind":"Field","name":{"kind":"Name","value":"governingDate"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"exclusions"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OpportunityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Opportunity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"opportunityId"}},{"kind":"Field","name":{"kind":"Name","value":"account"}},{"kind":"Field","name":{"kind":"Name","value":"clientManager"}},{"kind":"Field","name":{"kind":"Name","value":"clientManagerMapped"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"createdOn"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedClose"}},{"kind":"Field","name":{"kind":"Name","value":"actualClose"}},{"kind":"Field","name":{"kind":"Name","value":"statusReason"}},{"kind":"Field","name":{"kind":"Name","value":"statusGroup"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"forecastCategory"}},{"kind":"Field","name":{"kind":"Name","value":"probability"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedGP"}},{"kind":"Field","name":{"kind":"Name","value":"actualGP"}},{"kind":"Field","name":{"kind":"Name","value":"vertical"}},{"kind":"Field","name":{"kind":"Name","value":"salesCycleDays"}},{"kind":"Field","name":{"kind":"Name","value":"flags"}},{"kind":"Field","name":{"kind":"Name","value":"lossReason"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"competitor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stageAtLoss"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<DrillQuery, DrillQueryVariables>;
export const TargetsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Targets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FiltersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"targets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"scope"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ScopeFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"rows"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"goalId"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"quarter"}},{"kind":"Field","name":{"kind":"Name","value":"fiscalYear"}},{"kind":"Field","name":{"kind":"Name","value":"metric"}},{"kind":"Field","name":{"kind":"Name","value":"targetAED"}},{"kind":"Field","name":{"kind":"Name","value":"source"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ScopeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Scope"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"periodLabel"}},{"kind":"Field","name":{"kind":"Name","value":"governingDate"}},{"kind":"Field","name":{"kind":"Name","value":"recordCount"}},{"kind":"Field","name":{"kind":"Name","value":"exclusions"}},{"kind":"Field","name":{"kind":"Name","value":"asOf"}},{"kind":"Field","name":{"kind":"Name","value":"note"}}]}}]} as unknown as DocumentNode<TargetsQuery, TargetsQueryVariables>;
export const OpportunityDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Opportunity"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"guid"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"opportunity"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"guid"},"value":{"kind":"Variable","name":{"kind":"Name","value":"guid"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OpportunityFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OpportunityFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Opportunity"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"guid"}},{"kind":"Field","name":{"kind":"Name","value":"opportunityId"}},{"kind":"Field","name":{"kind":"Name","value":"account"}},{"kind":"Field","name":{"kind":"Name","value":"clientManager"}},{"kind":"Field","name":{"kind":"Name","value":"clientManagerMapped"}},{"kind":"Field","name":{"kind":"Name","value":"owner"}},{"kind":"Field","name":{"kind":"Name","value":"createdOn"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedClose"}},{"kind":"Field","name":{"kind":"Name","value":"actualClose"}},{"kind":"Field","name":{"kind":"Name","value":"statusReason"}},{"kind":"Field","name":{"kind":"Name","value":"statusGroup"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"forecastCategory"}},{"kind":"Field","name":{"kind":"Name","value":"probability"}},{"kind":"Field","name":{"kind":"Name","value":"estimatedGP"}},{"kind":"Field","name":{"kind":"Name","value":"actualGP"}},{"kind":"Field","name":{"kind":"Name","value":"vertical"}},{"kind":"Field","name":{"kind":"Name","value":"salesCycleDays"}},{"kind":"Field","name":{"kind":"Name","value":"flags"}},{"kind":"Field","name":{"kind":"Name","value":"lossReason"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"competitor"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stageAtLoss"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<OpportunityQuery, OpportunityQueryVariables>;