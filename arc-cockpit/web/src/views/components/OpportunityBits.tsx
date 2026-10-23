import { Badge } from '@/views/ui/badge';
import { FLAG_LABEL } from '@/models/format';
import { useDrill } from '@/controllers/useDrill';
import type { OpportunityFieldsFragment } from '@/models/gql/graphql';

export function OpportunityFlags({ flags }: { flags: string[] }) {
  if (!flags.length) return <span className="text-muted-foreground">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((f) => (
        <Badge key={f} variant={f === 'OVERDUE' || f === 'UNMAPPED_MANAGER' ? 'high' : 'medium'}>
          {FLAG_LABEL[f] ?? f}
        </Badge>
      ))}
    </div>
  );
}

/** Opportunity id as a button that opens the deal detail, with the account beneath. */
export function OpportunityCell({ o }: { o: Pick<OpportunityFieldsFragment, 'guid' | 'opportunityId' | 'account'> }) {
  const { openOpportunity } = useDrill();
  return (
    <div className="flex max-w-[280px] flex-col">
      <button type="button" onClick={() => openOpportunity(o.guid)} className="min-h-6 cursor-pointer self-start text-left font-medium text-link underline underline-offset-2">
        {o.opportunityId}
      </button>
      <span className="text-xs text-muted-foreground">{o.account}</span>
    </div>
  );
}

export function StatusBadge({ group, label }: { group: string; label: string }) {
  return <Badge variant={group === 'WON' ? 'info' : group === 'LOST' ? 'medium' : 'outline'}>{label}</Badge>;
}
