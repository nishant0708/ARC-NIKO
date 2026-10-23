import { useFilters, useOptions } from '@/controllers/useFilters';
import { Badge } from '@/views/ui/badge';

/** States the scope currently applied, so the page never hides a filter. */
export function ActiveFilters() {
  const f = useFilters();
  const { data } = useOptions();
  const period = data?.options.periods.find((p) => p.id === f.period)?.label ?? f.period;
  const chips = [period, f.clientManager && `Manager: ${f.clientManager}`, f.vertical && `Vertical: ${f.vertical}`, f.search && `Search: “${f.search}”`].filter(Boolean) as string[];
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span>Showing:</span>
      {chips.map((c) => (
        <Badge key={c}>{c}</Badge>
      ))}
    </div>
  );
}
