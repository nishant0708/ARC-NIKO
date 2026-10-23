import { GraphQLError } from 'graphql';
import {
  EXCL,
  closedIn,
  hasProbability,
  lostIn,
  monthKey,
  monthLabel,
  openIn,
  overdueIn,
  scope,
  sum,
  target,
  undatedOpen,
  wonIn,
} from '../models/measures.js';
import { repository } from '../models/repository.js';
import type { Filters, Opportunity } from '../models/types.js';
import { context, presentOpportunity } from './shared.js';

type DrillMeasure = 'ACHIEVED_GP' | 'OPEN_FORECAST_GP' | 'WEIGHTED_OPEN_GP' | 'UNDATED_OPEN' | 'OVERDUE_OPEN' | 'LOST_DEALS' | 'CLOSED_DEALS';
type DrillGroup = 'MONTH' | 'CLOSE_MONTH' | 'VERTICAL' | 'FORECAST_CATEGORY' | 'STAGE' | 'OUTCOME';

const GROUP_KEY: Record<DrillGroup, (o: Opportunity) => string | null> = {
  MONTH: (o) => monthKey(o.actualClose),
  CLOSE_MONTH: (o) => monthKey(o.estimatedClose),
  VERTICAL: (o) => o.vertical,
  FORECAST_CATEGORY: (o) => o.forecastCategory,
  STAGE: (o) => o.stage,
  OUTCOME: (o) => o.statusReason,
};

const TITLES: Record<DrillMeasure, string> = {
  ACHIEVED_GP: 'Achieved GP',
  OPEN_FORECAST_GP: 'Open forecast GP',
  WEIGHTED_OPEN_GP: 'Weighted open GP',
  UNDATED_OPEN: 'Undated open opportunities',
  OVERDUE_OPEN: 'Overdue open opportunities',
  LOST_DEALS: 'Lost deals',
  CLOSED_DEALS: 'Closed deals',
};

/** Drill-through: the exact records behind any figure, with its governing date and exclusions. */
export function drill(input: { filters: Filters; measure: DrillMeasure; groupBy?: DrillGroup | null; bucket?: string | null }) {
  const { repo, period: p, set } = context(input.filters);
  const asOf = repo.config.asOf;
  let rows: Opportunity[];
  let governingDate = 'Actual close date';
  let amountLabel = 'Actual GP';
  let amount: (o: Opportunity) => number | null = (o) => o.actualGP;
  let dateOf: (o: Opportunity) => string | null = (o) => o.actualClose;
  let exclusions: string[] = EXCL.achieved;

  switch (input.measure) {
    case 'ACHIEVED_GP':
      rows = wonIn(set, p);
      break;
    case 'OPEN_FORECAST_GP':
      rows = openIn(set, p);
      dateOf = (o) => o.estimatedClose;
      [governingDate, amountLabel, amount, exclusions] = ['Estimated close date', 'Est. GP', (o) => o.estimatedGP, EXCL.open];
      break;
    case 'WEIGHTED_OPEN_GP':
      rows = openIn(set, p).filter(hasProbability);
      dateOf = (o) => o.estimatedClose;
      [governingDate, amountLabel, amount, exclusions] = ['Estimated close date', 'Weighted GP', (o) => ((o.estimatedGP ?? 0) * (o.probability ?? 0)) / 100, EXCL.weighted];
      break;
    case 'UNDATED_OPEN':
      rows = undatedOpen(set);
      dateOf = (o) => o.estimatedClose;
      [governingDate, amountLabel, amount, exclusions] = ['No estimated close date', 'Est. GP', (o) => o.estimatedGP, ['Dated open deals', 'Closed deals']];
      break;
    case 'OVERDUE_OPEN':
      rows = overdueIn(set, p, asOf);
      dateOf = (o) => o.estimatedClose;
      [governingDate, amountLabel, amount, exclusions] = ['Estimated close date vs as-of date', 'Est. GP', (o) => o.estimatedGP, ['Open deals not yet due', 'Closed deals']];
      break;
    case 'LOST_DEALS':
      rows = lostIn(set, p);
      [amountLabel, amount, exclusions] = ['Est. GP (estimate)', (o) => o.estimatedGP, ['Cancelled and disqualified deals are not counted as lost']];
      break;
    case 'CLOSED_DEALS':
      rows = closedIn(set, p);
      [amountLabel, amount, exclusions] = ['GP (actual if won, estimate otherwise)', (o) => (o.group === 'WON' ? o.actualGP : o.estimatedGP), ['Open deals', 'Deals without an actual close date in the period']];
      break;
    default:
      throw new GraphQLError('Unknown drill measure', { extensions: { code: 'BAD_USER_INPUT' } });
  }

  let title = TITLES[input.measure];
  if (input.groupBy && input.bucket) {
    const key = GROUP_KEY[input.groupBy];
    if (input.bucket === '__REMAINING__') {
      title += ' · remaining groups';
    } else {
      rows = rows.filter((o) => (key(o) || 'Not recorded') === input.bucket);
      const isMonth = input.groupBy === 'MONTH' || input.groupBy === 'CLOSE_MONTH';
      title += ` · ${isMonth ? monthLabel(input.bucket) : input.bucket}`;
    }
  }
  if (input.filters.clientManager) title += ` · ${input.filters.clientManager}`;

  rows = [...rows].sort((a, b) => (amount(b) ?? 0) - (amount(a) ?? 0));
  return {
    title,
    governingDate,
    amountLabel,
    total: sum(rows, amount),
    scope: scope(repo, input.measure === 'UNDATED_OPEN' ? null : p, governingDate, rows.length, exclusions),
    rows: rows.map((o) => ({ amount: amount(o), governingDateValue: dateOf(o), opportunity: presentOpportunity(o, repo) })),
  };
}

export function targets(filters: Filters) {
  const { repo, filters: f, period: p } = context(filters);
  const managers = f.clientManager ? [f.clientManager] : repo.clientManagers.map((m) => m.name);
  const t = target(repo, managers, p);
  return { total: t.value, scope: t.scope, rows: t.goals };
}

export function opportunity(guid: string) {
  const repo = repository();
  const o = repo.opportunities.find((x) => x.guid === guid);
  return o ? presentOpportunity(o, repo) : null;
}
