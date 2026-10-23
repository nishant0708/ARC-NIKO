import {
  groupBuckets,
  monthKey,
  monthLabel,
  openForecastGP,
  openIn,
  overdueMeasure,
  undatedMeasure,
  undatedOpen,
  weightedOpenGP,
} from '../models/measures.js';
import type { Filters } from '../models/types.js';
import { context, presentOpportunity } from './shared.js';

export function pipeline(filters: Filters) {
  const { repo, period: p, set } = context(filters);
  const open = openIn(set, p);
  const weighted = weightedOpenGP(repo, set, p);
  const listed = [...open, ...undatedOpen(set)].sort((a, b) => (b.estimatedGP ?? 0) - (a.estimatedGP ?? 0));
  return {
    openGP: openForecastGP(repo, set, p),
    weightedOpenGP: { value: weighted.value, count: weighted.count, scope: weighted.scope },
    missingProbability: weighted.missingProbability,
    undated: undatedMeasure(repo, set),
    overdue: overdueMeasure(repo, set, p),
    byStage: groupBuckets(open, (o) => o.stage, (o) => o.estimatedGP ?? 0),
    byCloseMonth: groupBuckets(open, (o) => monthKey(o.estimatedClose), (o) => o.estimatedGP ?? 0, { sort: 'key', label: monthLabel }),
    byCategory: groupBuckets(open, (o) => o.forecastCategory, (o) => o.estimatedGP ?? 0),
    opportunities: listed.map((o) => presentOpportunity(o, repo)),
  };
}
