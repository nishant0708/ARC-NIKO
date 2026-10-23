import type { Filters, Opportunity } from './types.js';

/**
 * Applies the global cockpit filters (client manager, vertical, record search).
 * The fiscal period is applied per measure, because each measure has its own governing date.
 */
export function applyFilters(
  opps: Opportunity[],
  f: Filters,
  opts: { ignoreClientManager?: boolean } = {},
): Opportunity[] {
  const q = (f.search ?? '').trim().toLowerCase();
  return opps.filter((o) => {
    if (!opts.ignoreClientManager && f.clientManager && o.clientManager !== f.clientManager) return false;
    if (f.vertical && o.vertical !== f.vertical) return false;
    if (q) {
      const hay = `${o.opportunityId} ${o.account} ${o.clientManager} ${o.guid}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
