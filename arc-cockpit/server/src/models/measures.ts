import { formatAsOf, inPeriod, monthLabel } from './period.js';
import type { Repository } from './repository.js';
import type { Bucket, Goal, Measure, Opportunity, Period, Scope } from './types.js';

/**
 * Governed KPI definitions (BRD / VENDOR KPI Dictionary).
 * Every calculation lives here, once. Controllers compose these; the web app only displays.
 */

export const sum = <T>(xs: T[], f: (x: T) => number | null | undefined) => xs.reduce((t, x) => t + (f(x) ?? 0), 0);

export function scope(
  repo: Repository,
  period: Period | null,
  governingDate: string,
  records: number,
  exclusions: string[],
  note?: string,
): Scope {
  return {
    periodLabel: period ? period.label : 'All periods',
    governingDate,
    recordCount: records,
    exclusions,
    asOf: formatAsOf(repo.config.asOf),
    note: note ?? null,
  };
}

// ---------- record selections (each with its governing date) ----------

/** FIN-02: won deals whose ACTUAL close date falls in the period. */
export const wonIn = (set: Opportunity[], p: Period) => set.filter((o) => o.group === 'WON' && inPeriod(o.actualClose, p));
/** OUT-03: lost deals by actual close date. */
export const lostIn = (set: Opportunity[], p: Period) => set.filter((o) => o.group === 'LOST' && inPeriod(o.actualClose, p));
/** FIN-05: eligible open deals whose ESTIMATED close date falls in the period. */
export const openIn = (set: Opportunity[], p: Period) => set.filter((o) => o.group === 'OPEN' && inPeriod(o.estimatedClose, p));
/** Open deals with no estimated close date: disclosed separately, never placed in a period. */
export const undatedOpen = (set: Opportunity[]) => set.filter((o) => o.group === 'OPEN' && !o.estimatedClose);
/** Overdue is calculated from the close-date rule against the as-of date, never read from a stored flag. */
export const overdueIn = (set: Opportunity[], p: Period, asOf: string) =>
  openIn(set, p).filter((o) => (o.estimatedClose as string) < asOf);
export const hasProbability = (o: Opportunity) => o.probability !== null && o.probability !== undefined;
/** Closed (won, lost or excluded) with an actual close date in the period. */
export const closedIn = (set: Opportunity[], p: Period) =>
  set.filter((o) => o.group !== 'OPEN' && inPeriod(o.actualClose, p));

// ---------- measures ----------

export const EXCL = {
  achieved: ['Open, lost, on hold, cancelled and disqualified deals', 'Won deals with an actual close date outside the period'],
  open: ['Undated open deals (disclosed separately)', 'On hold, cancelled and disqualified deals'],
  weighted: ['Open deals without a recorded probability (flagged, never defaulted)', 'Undated open deals'],
  target: ['Pre-Sales Actual GP goals', 'Monthly targets are never derived by dividing a quarterly goal'],
};

export function achievedGP(repo: Repository, set: Opportunity[], p: Period): Measure {
  const won = wonIn(set, p);
  return { value: sum(won, (o) => o.actualGP), count: won.length, scope: scope(repo, p, 'Actual close date', won.length, EXCL.achieved) };
}

export function openForecastGP(repo: Repository, set: Opportunity[], p: Period): Measure {
  const open = openIn(set, p);
  const undated = undatedOpen(set).length;
  return {
    value: sum(open, (o) => o.estimatedGP),
    count: open.length,
    scope: scope(repo, p, 'Estimated close date', open.length, EXCL.open, `${undated} undated open deals shown separately`),
  };
}

export function weightedOpenGP(repo: Repository, set: Opportunity[], p: Period): Measure & { missingProbability: number } {
  const open = openIn(set, p);
  const withP = open.filter(hasProbability);
  return {
    value: sum(withP, (o) => ((o.estimatedGP ?? 0) * (o.probability as number)) / 100),
    count: withP.length,
    missingProbability: open.length - withP.length,
    scope: scope(repo, p, 'Estimated close date', withP.length, EXCL.weighted),
  };
}

export function undatedMeasure(repo: Repository, set: Opportunity[]): Measure {
  const u = undatedOpen(set);
  return { value: sum(u, (o) => o.estimatedGP), count: u.length, scope: scope(repo, null, 'No estimated close date', u.length, ['Dated open deals', 'Closed deals']) };
}

export function overdueMeasure(repo: Repository, set: Opportunity[], p: Period): Measure {
  const od = overdueIn(set, p, repo.config.asOf);
  return {
    value: sum(od, (o) => o.estimatedGP),
    count: od.length,
    scope: scope(repo, p, 'Estimated close date vs as-of date', od.length, ['Open deals not yet due', 'Closed deals'], 'Calculated, not a stored flag'),
  };
}

/** FIN-01: sum of explicit quarterly goal rows. A manager without a goal row contributes nothing (shown as not recorded). */
export function targetGoals(repo: Repository, managers: string[], p: Period): Goal[] {
  const names = new Set(managers);
  return repo.goals.filter(
    (g) => names.has(g.owner) && g.metric === 'Actual GP' && g.fiscalYear === repo.config.fiscalYear && p.quarters.includes(g.quarter),
  );
}

export function target(repo: Repository, managers: string[], p: Period): { value: number | null; goals: Goal[]; managers: number; scope: Scope } {
  const goals = targetGoals(repo, managers, p);
  const mgrs = new Set(goals.map((g) => g.owner)).size;
  return {
    value: goals.length ? sum(goals, (g) => g.targetAED) : null,
    goals,
    managers: mgrs,
    scope: scope(repo, p, 'Goal fiscal period', goals.length, EXCL.target, goals.some((g) => /sample/i.test(g.source)) ? 'Includes sample goals for the demo' : undefined),
  };
}

/** FIN-04: target minus achieved. Negative = exceeded. */
export function gap(targetValue: number | null, achieved: number) {
  if (targetValue === null) return { value: null, exceeded: false, attainment: null };
  const g = targetValue - achieved;
  return { value: g, exceeded: g < 0, attainment: targetValue > 0 ? achieved / targetValue : null };
}

/** OUT-01: won / (won + lost) by actual close. Cancelled and disqualified are outside the denominator (status rules). */
export function winRate(won: number, lost: number): number | null {
  return won + lost > 0 ? won / (won + lost) : null;
}

export function salesCycleDays(o: Opportunity): number | null {
  if (!o.createdOn || !o.actualClose || (o.group !== 'WON' && o.group !== 'LOST')) return null;
  return Math.round((Date.parse(o.actualClose) - Date.parse(o.createdOn)) / 86_400_000);
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ---------- grouping ----------

export function groupBuckets(
  set: Opportunity[],
  key: (o: Opportunity) => string | null,
  value: (o: Opportunity) => number,
  opts: { sort?: 'value' | 'key'; top?: number; label?: (k: string) => string } = {},
): Bucket[] {
  const m = new Map<string, Opportunity[]>();
  for (const o of set) {
    const k = key(o) || 'Not recorded';
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(o);
  }
  let buckets: Bucket[] = [...m.entries()].map(([k, os]) => ({
    key: k,
    label: opts.label ? opts.label(k) : k,
    value: os.reduce((t, o) => t + value(o), 0),
    count: os.length,
  }));
  buckets.sort(opts.sort === 'key' ? (a, b) => a.key.localeCompare(b.key) : (a, b) => b.value - a.value);
  if (opts.top && buckets.length > opts.top + 1) {
    const rest = buckets.slice(opts.top);
    buckets = [
      ...buckets.slice(0, opts.top),
      { key: '__REMAINING__', label: `Remaining ${rest.length} groups`, value: sum(rest, (b) => b.value), count: sum(rest, (b) => b.count) },
    ];
  }
  return buckets;
}

export const monthKey = (d: string | null) => (d ? d.slice(0, 7) : null);
export { monthLabel };
