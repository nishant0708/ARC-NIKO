import { formatAsOf, periodsFor } from '../models/period.js';
import { repository } from '../models/repository.js';

export function options() {
  const repo = repository();
  const names = new Set<string>([...repo.clientManagers.map((m) => m.name), ...repo.opportunities.map((o) => o.clientManager)]);
  const verticals = new Set<string>();
  repo.opportunities.forEach((o) => o.vertical && verticals.add(o.vertical));
  // Default to the quarter that contains the as-of date.
  const q = Math.floor((Number(repo.config.asOf.slice(5, 7)) - 1) / 3) + 1;
  return {
    asOf: formatAsOf(repo.config.asOf),
    asOfIso: repo.config.asOf,
    source: repo.config.source,
    currency: repo.config.currency,
    defaultPeriod: `${repo.config.fiscalYear}-Q${q}`,
    periods: periodsFor(repo.config.fiscalYear).map((p) => ({ id: p.id, label: p.label })),
    clientManagers: [...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ name, mapped: repo.isMappedManager(name) })),
    verticals: [...verticals].sort((a, b) => a.localeCompare(b)),
  };
}
