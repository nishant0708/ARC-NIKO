import {
  achievedGP,
  gap,
  lostIn,
  median,
  monthKey,
  openForecastGP,
  salesCycleDays,
  scope,
  sum,
  target,
  weightedOpenGP,
  winRate,
  wonIn,
} from '../models/measures.js';
import { formatAsOf, inPeriod, monthsOfYear } from '../models/period.js';
import type { Filters } from '../models/types.js';
import { context, presentOpportunity } from './shared.js';

/** Client Manager 360 with Win/Loss. Returns null when no manager is selected. */
export function cm360(filters: Filters) {
  const { repo, filters: f, period: p, set } = context(filters);
  const name = f.clientManager;
  if (!name) return null;

  const won = wonIn(set, p);
  const lost = lostIn(set, p);
  const t = target(repo, [name], p);
  const achieved = achievedGP(repo, set, p);
  const weighted = weightedOpenGP(repo, set, p);
  const excludedFromWinRate = set.filter(
    (o) => (o.statusReason === 'CANCELLED' || o.statusReason === 'DISQUALIFIED') && inPeriod(o.actualClose ?? o.estimatedClose, p),
  ).length;
  const cycles = [...won, ...lost].map(salesCycleDays).filter((d): d is number => d !== null);

  const yearClosed = set.filter((o) => (o.group === 'WON' || o.group === 'LOST') && o.actualClose?.startsWith(String(repo.config.fiscalYear)));
  const trend = monthsOfYear(repo.config.fiscalYear).map((m) => {
    const ms = yearClosed.filter((o) => monthKey(o.actualClose) === m.key);
    return { month: m.key, label: m.label, won: ms.filter((o) => o.group === 'WON').length, lost: ms.filter((o) => o.group === 'LOST').length, afterAsOf: m.start > repo.config.asOf };
  });

  return {
    clientManager: name,
    mapped: repo.isMappedManager(name),
    opportunityCount: set.length,
    periodLabel: p.label,
    asOf: formatAsOf(repo.config.asOf),
    target: { value: t.value, managerCount: t.managers, goalCount: t.goals.length, scope: t.scope },
    achieved,
    gap: gap(t.value, achieved.value),
    openForecast: openForecastGP(repo, set, p),
    weightedOpen: { value: weighted.value, count: weighted.count, scope: weighted.scope },
    won: { value: sum(won, (o) => o.actualGP), count: won.length, scope: scope(repo, p, 'Actual close date', won.length, ['Open and excluded deals']) },
    lost: {
      value: sum(lost, (o) => o.estimatedGP),
      count: lost.length,
      scope: scope(repo, p, 'Actual close date', lost.length, ['Cancelled and disqualified deals'], 'Lost GP is an estimate, not realised GP'),
    },
    winRate: winRate(won.length, lost.length),
    winRateExcludedCount: excludedFromWinRate,
    winRateTreatment:
      'Win rate = won ÷ (won + lost) by actual close date. Cancelled and disqualified deals are left out of the denominator; this treatment is pending ARC sign-off.',
    medianSalesCycleDays: median(cycles),
    salesCycleSample: cycles.length,
    trend,
    deals: [...won, ...lost].sort((a, b) => ((a.actualClose ?? '') < (b.actualClose ?? '') ? 1 : -1)).map((o) => presentOpportunity(o, repo)),
  };
}
