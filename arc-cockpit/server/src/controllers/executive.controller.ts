import {
  achievedGP,
  closedIn,
  gap,
  groupBuckets,
  monthKey,
  monthLabel,
  openForecastGP,
  openIn,
  overdueMeasure,
  sum,
  target,
  undatedMeasure,
  wonIn,
} from '../models/measures.js';
import { formatAsOf, monthsOfYear } from '../models/period.js';
import { scopeWarnings } from '../models/scopeChecks.js';
import type { Filters } from '../models/types.js';
import { context } from './shared.js';

const OUTCOME_LABEL: Record<string, string> = { WON: 'Won', LOST: 'Lost', CANCELLED: 'Cancelled', DISQUALIFIED: 'Disqualified', 'On Hold': 'On hold' };

export function executive(filters: Filters) {
  const { repo, filters: f, period: p, set } = context(filters);
  const managers = f.clientManager ? [f.clientManager] : repo.clientManagers.map((m) => m.name);
  const t = target(repo, managers, p);
  const achieved = achievedGP(repo, set, p);
  const won = wonIn(set, p);
  const open = openIn(set, p);
  const asOf = repo.config.asOf;

  const yearWon = set.filter((o) => o.group === 'WON' && o.actualClose?.startsWith(String(repo.config.fiscalYear)));
  const achievedByMonth = monthsOfYear(repo.config.fiscalYear).map((m) => {
    const ms = yearWon.filter((o) => monthKey(o.actualClose) === m.key);
    return { month: m.key, label: m.label, value: sum(ms, (o) => o.actualGP), count: ms.length, inPeriod: m.start >= p.start && m.end <= p.end, afterAsOf: m.start > asOf };
  });

  const openByCloseMonth = groupBuckets(open, (o) => monthKey(o.estimatedClose), (o) => o.estimatedGP ?? 0, { sort: 'key', label: monthLabel }).map((b) => ({
    ...b,
    flag: `${b.key}-31` < asOf ? 'OVERDUE' : null,
  }));

  return {
    periodLabel: p.label,
    asOf: formatAsOf(asOf),
    target: { value: t.value, managerCount: t.managers, goalCount: t.goals.length, scope: t.scope },
    achieved,
    gap: gap(t.value, achieved.value),
    openForecast: openForecastGP(repo, set, p),
    undated: undatedMeasure(repo, set),
    overdue: overdueMeasure(repo, set, p),
    warnings: scopeWarnings(repo, f, p, won),
    achievedByMonth,
    openByCloseMonth,
    achievedByVertical: groupBuckets(won, (o) => o.vertical, (o) => o.actualGP ?? 0, { top: 5 }),
    openByCategory: groupBuckets(open, (o) => o.forecastCategory, (o) => o.estimatedGP ?? 0),
    closedOutcomes: groupBuckets(closedIn(set, p), (o) => o.statusReason, () => 1, { label: (k) => OUTCOME_LABEL[k] ?? k }),
  };
}
