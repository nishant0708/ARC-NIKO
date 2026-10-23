import { evaluateExceptions } from '../models/exceptions.js';
import { gap, lostIn, openIn, scope, sum, target, winRate, wonIn } from '../models/measures.js';
import type { Filters } from '../models/types.js';
import { context } from './shared.js';

/** Client manager comparison. Attribution is to the business client manager, not the record owner. */
export function clientManagers(filters: Filters) {
  const { repo, period: p, setAllManagers: set } = context(filters);
  const names = new Set<string>([...repo.clientManagers.map((m) => m.name), ...set.map((o) => o.clientManager)]);

  const rows = [...names]
    .map((name) => {
      const mine = set.filter((o) => o.clientManager === name);
      const won = wonIn(mine, p);
      const lost = lostIn(mine, p);
      const t = target(repo, [name], p).value;
      const achieved = sum(won, (o) => o.actualGP);
      return {
        name,
        mapped: repo.isMappedManager(name),
        target: t,
        achieved,
        openGP: sum(openIn(mine, p), (o) => o.estimatedGP),
        gap: gap(t, achieved).value,
        winRate: winRate(won.length, lost.length),
        won: won.length,
        lost: lost.length,
        exceptionCount: evaluateExceptions(repo, mine).length,
        opportunityCount: mine.length,
      };
    })
    .filter((r) => r.opportunityCount > 0 || r.mapped);

  return {
    scope: scope(repo, p, 'Actual close (achieved, win rate) · estimated close (open GP)', rows.length, [
      'Cancelled and disqualified deals are outside the win-rate denominator',
    ]),
    rows,
    opportunityCount: set.length,
    ownerDiffersCount: set.filter((o) => o.owner && o.owner !== o.clientManager).length,
  };
}
