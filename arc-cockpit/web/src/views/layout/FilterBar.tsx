import { useEffect, useId, useState } from 'react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useFilters, useOptions } from '@/controllers/useFilters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/views/ui/select';
import { Input } from '@/views/ui/input';
import { Label } from '@/views/ui/label';
import { Button } from '@/views/ui/button';

const ALL = '__all__';

/** Global filters: fiscal period, client manager, vertical and record search. State is kept in the URL. */
export function FilterBar() {
  const f = useFilters();
  const { data } = useOptions();
  const o = data?.options;
  const ids = { period: useId(), cm: useId(), vertical: useId(), search: useId() };

  // Search is typed locally and written to the URL after a short pause.
  const [q, setQ] = useState(f.search);
  useEffect(() => setQ(f.search), [f.search]);
  useEffect(() => {
    const t = setTimeout(() => q !== f.search && f.setSearch(q), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <form role="search" aria-label="Global filters" className="flex flex-wrap items-end gap-3" onSubmit={(e) => e.preventDefault()}>
      <div className="flex w-[210px] flex-col gap-1">
        <Label id={ids.period}>Fiscal period</Label>
        <Select value={f.period} onValueChange={f.setPeriod}>
          <SelectTrigger aria-labelledby={ids.period}>
            <SelectValue placeholder="Loading…" />
          </SelectTrigger>
          <SelectContent>
            {o?.periods.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-[230px] flex-col gap-1">
        <Label id={ids.cm}>Client manager</Label>
        <Select value={f.clientManager || ALL} onValueChange={(v) => f.setClientManager(v === ALL ? '' : v)}>
          <SelectTrigger aria-labelledby={ids.cm}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All client managers</SelectItem>
            {o?.clientManagers.map((m) => (
              <SelectItem key={m.name} value={m.name}>
                {m.name}
                {m.mapped ? '' : ' (unmapped)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex w-[210px] flex-col gap-1">
        <Label id={ids.vertical}>Vertical</Label>
        <Select value={f.vertical || ALL} onValueChange={(v) => f.setVertical(v === ALL ? '' : v)}>
          <SelectTrigger aria-labelledby={ids.vertical}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All verticals</SelectItem>
            {o?.verticals.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-w-[220px] flex-1 flex-col gap-1">
        <Label htmlFor={ids.search}>Record search</Label>
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input id={ids.search} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Opportunity ID, account or manager" className="pl-8" />
        </div>
      </div>
      <Button variant="outline" onClick={f.reset}>
        Reset filters
      </Button>
    </form>
  );
}
