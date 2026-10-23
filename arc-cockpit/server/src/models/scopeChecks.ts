import { formatAsOf } from './period.js';
import type { Repository } from './repository.js';
import type { Filters, Opportunity, Period } from './types.js';
import { sum } from './measures.js';

export interface ScopeWarning {
  kind: 'SCOPE_MISMATCH' | 'NO_TARGET' | 'PARTIAL_SCOPE' | 'PERIOD_OPEN';
  title: string;
  message: string;
}

const aed = (n: number) => `AED ${Math.round(n).toLocaleString('en-US')}`;

/** Warns when target and achievement do not cover the same period or scope (BRD Executive requirement). */
export function scopeWarnings(repo: Repository, f: Filters, p: Period, won: Opportunity[]): ScopeWarning[] {
  const w: ScopeWarning[] = [];
  if (!f.clientManager) {
    const unmapped = won.filter((o) => !o.clientManagerMapped);
    if (unmapped.length) {
      const names = [...new Set(unmapped.map((o) => o.clientManager))];
      w.push({
        kind: 'SCOPE_MISMATCH',
        title: 'Scope mismatch',
        message: `Achieved GP includes ${aed(sum(unmapped, (o) => o.actualGP))} from ${unmapped.length} won deals of ${names.length} managers with no target (${names.join(', ')}). The target covers ${repo.clientManagers.length} managers.`,
      });
    }
  } else if (!repo.isMappedManager(f.clientManager)) {
    w.push({ kind: 'NO_TARGET', title: 'No target recorded', message: `${f.clientManager} is not in the client manager directory, so target and gap cannot be shown.` });
  }
  if (f.vertical) {
    w.push({ kind: 'SCOPE_MISMATCH', title: 'Scope mismatch', message: `Targets are not split by vertical. Achieved and open GP are filtered to ${f.vertical}; the target is not.` });
  }
  if (f.search) {
    w.push({ kind: 'PARTIAL_SCOPE', title: 'Partial scope', message: 'Record search is active, so achieved and open GP cover only matching records; the target does not.' });
  }
  if (p.end > repo.config.asOf) {
    w.push({ kind: 'PERIOD_OPEN', title: 'Period not complete', message: `${p.label} runs past the data as-of date; achievement is counted up to ${formatAsOf(repo.config.asOf)}.` });
  }
  return w;
}
