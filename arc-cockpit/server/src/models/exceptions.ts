import type { Repository } from './repository.js';
import type { ExceptionRule, Opportunity } from './types.js';

export interface ExceptionItem {
  rule: ExceptionRule;
  opportunity: Opportunity;
}

/**
 * Objective data-quality and decision rules (configured in data/exception-rules.json).
 * They describe records, never a person's performance.
 */
const CHECKS: Record<string, (o: Opportunity, asOf: string) => boolean> = {
  E01: (o) => o.group === 'OPEN' && !o.estimatedClose,
  E02: (o) => o.group === 'OPEN' && (o.probability === null || o.probability === undefined),
  E03: (o, asOf) => o.group === 'OPEN' && !!o.estimatedClose && o.estimatedClose < asOf,
  E04: (o) => !o.clientManagerMapped,
  E05: (o) => o.group === 'WON' && !((o.actualGP ?? 0) > 0),
};

export function evaluateExceptions(repo: Repository, set: Opportunity[]): ExceptionItem[] {
  const out: ExceptionItem[] = [];
  for (const o of set) {
    for (const rule of repo.exceptionRules) {
      const check = CHECKS[rule.id];
      if (check && check(o, repo.config.asOf)) out.push({ rule, opportunity: o });
    }
  }
  const rank = { HIGH: 0, MEDIUM: 1 } as const;
  return out.sort(
    (a, b) => rank[a.rule.severity] - rank[b.rule.severity] || (b.opportunity.estimatedGP ?? 0) - (a.opportunity.estimatedGP ?? 0),
  );
}

/** Flags shown next to an opportunity wherever it is listed. */
export function opportunityFlags(o: Opportunity, asOf: string): string[] {
  const f: string[] = [];
  if (o.group === 'OPEN' && !o.estimatedClose) f.push('UNDATED');
  if (o.group === 'OPEN' && o.estimatedClose && o.estimatedClose < asOf) f.push('OVERDUE');
  if (o.group === 'OPEN' && (o.probability === null || o.probability === undefined)) f.push('PROBABILITY_NOT_RECORDED');
  if (!o.clientManagerMapped) f.push('UNMAPPED_MANAGER');
  return f;
}
