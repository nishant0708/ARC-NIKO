import { opportunityFlags } from '../models/exceptions.js';
import { applyFilters } from '../models/filters.js';
import { salesCycleDays } from '../models/measures.js';
import { resolvePeriod } from '../models/period.js';
import { repository, type Repository } from '../models/repository.js';
import type { Filters, Opportunity, Period } from '../models/types.js';

export interface FilterContext {
  repo: Repository;
  filters: Filters;
  period: Period;
  /** Records after client manager, vertical and search filters. */
  set: Opportunity[];
  /** Same, without the client manager filter (for the comparison table). */
  setAllManagers: Opportunity[];
}

export function context(filters: Filters): FilterContext {
  const repo = repository();
  const clean: Filters = {
    period: filters.period,
    clientManager: filters.clientManager || null,
    vertical: filters.vertical || null,
    search: filters.search?.trim() || null,
  };
  const period = resolvePeriod(clean.period, repo.config.fiscalYear);
  return {
    repo,
    filters: clean,
    period,
    set: applyFilters(repo.opportunities, clean),
    setAllManagers: applyFilters(repo.opportunities, clean, { ignoreClientManager: true }),
  };
}

/** Presents an opportunity in the API shape. Missing data is reported as not recorded, never filled in. */
export function presentOpportunity(o: Opportunity, repo: Repository) {
  const closedLost = o.group === 'LOST';
  return {
    guid: o.guid,
    opportunityId: o.opportunityId,
    account: o.account,
    clientManager: o.clientManager,
    clientManagerMapped: o.clientManagerMapped,
    owner: o.owner,
    createdOn: o.createdOn,
    estimatedClose: o.estimatedClose,
    actualClose: o.actualClose,
    statusReason: o.statusReason,
    statusGroup: o.group,
    stage: o.stage,
    forecastCategory: o.forecastCategory,
    probability: o.probability,
    estimatedGP: o.estimatedGP,
    actualGP: o.group === 'WON' ? o.actualGP : null,
    vertical: o.vertical,
    salesCycleDays: salesCycleDays(o),
    flags: opportunityFlags(o, repo.config.asOf),
    // The PILOT export has no loss reason or competitor fields; stage at loss needs snapshot history.
    lossReason: { value: null, status: closedLost ? 'NOT_RECORDED' : 'NOT_APPLICABLE' },
    competitor: { value: null, status: 'NOT_RECORDED' },
    stageAtLoss: { value: null, status: closedLost ? 'NOT_PRODUCIBLE' : 'NOT_APPLICABLE' },
  };
}
