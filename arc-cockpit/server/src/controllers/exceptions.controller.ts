import { evaluateExceptions } from '../models/exceptions.js';
import { sum } from '../models/measures.js';
import { formatAsOf } from '../models/period.js';
import type { Filters, Severity } from '../models/types.js';
import { context, presentOpportunity } from './shared.js';

export function exceptions(filters: Filters, severity?: Severity | null, ruleId?: string | null) {
  const { repo, set } = context(filters);
  const all = evaluateExceptions(repo, set);
  const filtered = all.filter((x) => (!severity || x.rule.severity === severity) && (!ruleId || x.rule.id === ruleId));
  const asOf = formatAsOf(repo.config.asOf);
  const openExposure = new Map<string, number>();
  all.forEach((x) => x.opportunity.group === 'OPEN' && openExposure.set(x.opportunity.guid, x.opportunity.estimatedGP ?? 0));

  return {
    asOf,
    total: all.length,
    filteredTotal: filtered.length,
    gpExposure: sum([...openExposure.values()], (v) => v), // each open deal counted once, even with several exceptions
    bySeverity: (['HIGH', 'MEDIUM'] as const).map((s) => ({ severity: s, count: all.filter((x) => x.rule.severity === s).length })),
    byRule: repo.exceptionRules.map((rule) => ({ rule, count: all.filter((x) => x.rule.id === rule.id).length })),
    rules: repo.exceptionRules,
    items: filtered.map((x) => ({
      id: `${x.rule.id}:${x.opportunity.guid}`,
      rule: x.rule,
      severity: x.rule.severity,
      opportunity: presentOpportunity(x.opportunity, repo),
      gpExposure: x.opportunity.group === 'OPEN' ? x.opportunity.estimatedGP : null,
      asOf,
    })),
  };
}
