import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon, CaretSortIcon } from '@radix-ui/react-icons';
import { useClientManagers } from '@/controllers/useScreens';
import { useFilters } from '@/controllers/useFilters';
import { useDrill } from '@/controllers/useDrill';
import { aed, percent } from '@/models/format';
import type { ClientManagersQuery } from '@/models/gql/graphql';
import { Badge } from '@/views/ui/badge';
import { Button } from '@/views/ui/button';
import { Input } from '@/views/ui/input';
import { Label } from '@/views/ui/label';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/views/ui/table';
import { Notice } from '@/views/components/Notice';
import { ScopeLine } from '@/views/components/ScopeLine';
import { ErrorNotice, LoadingGrid } from '@/views/components/QueryState';
import { PageHeader } from '@/views/components/PageHeader';
import { ActiveFilters } from '@/views/layout/ActiveFilters';
import { cn } from '@/lib/utils';

type Row = ClientManagersQuery['clientManagers']['rows'][number];
type SortKey = 'name' | 'target' | 'achieved' | 'openGP' | 'gap' | 'winRate' | 'exceptionCount';

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Client manager', numeric: false },
  { key: 'target', label: 'GP target', numeric: true },
  { key: 'achieved', label: 'Achieved GP', numeric: true },
  { key: 'openGP', label: 'Open GP', numeric: true },
  { key: 'gap', label: 'GP gap', numeric: true },
  { key: 'winRate', label: 'Win rate', numeric: true },
  { key: 'exceptionCount', label: 'Exceptions', numeric: true },
];

export function ClientManagersScreen() {
  const { data, loading, error } = useClientManagers();
  const f = useFilters();
  const { open } = useDrill();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState('');
  const sortKey = (params.get('sort') as SortKey) || 'gap';
  const sortDir = params.get('dir') === 'asc' ? 'asc' : 'desc';

  const rows = useMemo(() => {
    const list = (data?.clientManagers.rows ?? []).filter((r) => r.name.toLowerCase().includes(filter.toLowerCase()));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const x = a[sortKey];
      const y = b[sortKey];
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      if (typeof x === 'string' && typeof y === 'string') return x.localeCompare(y) * dir;
      return ((x as number) - (y as number)) * dir;
    });
  }, [data, filter, sortKey, sortDir]);

  const header = <PageHeader title="Client Managers" question="Which client managers are behind target, and which deals explain the gap?" />;
  if (error) return <>{header}<ErrorNotice error={error} /></>;
  if (loading && !data) return <>{header}<LoadingGrid cards={0} /></>;
  if (!data) return header;
  const v = data.clientManagers;

  const sortBy = (k: SortKey) => f.setMany({ sort: k, dir: sortKey === k && sortDir === 'desc' ? 'asc' : 'desc' });
  const drillFor = (r: Row, measure: 'ACHIEVED_GP' | 'OPEN_FORECAST_GP') => open({ kind: 'measure', filters: { ...f.input, clientManager: r.name }, measure });
  const select = (r: Row) => navigate({ pathname: '/cm360', search: withParam(params, 'cm', r.name) });

  return (
    <>
      {header}
      <ActiveFilters />
      <Notice>
        Performance is attributed to the <strong>business client manager</strong> on each opportunity (emitac_clientmanager), not the CRM record owner.{' '}
        {v.ownerDiffersCount} of {v.opportunityCount} opportunities in view have a different CRM owner.
      </Notice>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex w-[260px] flex-col gap-1">
          <Label htmlFor="cm-filter">Filter this table</Label>
          <Input id="cm-filter" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Manager name" />
        </div>
        <ScopeLine scope={v.scope} />
      </div>
      <Table>
        <TableCaption>Client manager performance for the selected period, sorted by {COLUMNS.find((c) => c.key === sortKey)?.label}</TableCaption>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((c) => (
              <TableHead key={c.key} scope="col" aria-sort={sortKey === c.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'} className={cn(c.numeric && 'text-right')}>
                <button type="button" onClick={() => sortBy(c.key)} className="inline-flex min-h-6 cursor-pointer items-center gap-1 font-medium">
                  {c.label}
                  <CaretSortIcon aria-hidden />
                </button>
              </TableHead>
            ))}
            <TableHead scope="col">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.name} data-state={f.clientManager === r.name ? 'selected' : undefined}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{r.name}</span>
                  {!r.mapped && (
                    <Badge variant="high" className="self-start">
                      Unmapped manager · data-quality exception
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">{r.target === null || r.target === undefined ? 'Not recorded' : aed(r.target)}</TableCell>
              <TableCell className="text-right tabular-nums">
                <button type="button" className="min-h-6 cursor-pointer text-link underline underline-offset-2" onClick={() => drillFor(r, 'ACHIEVED_GP')}>
                  {aed(r.achieved)}
                </button>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <button type="button" className="min-h-6 cursor-pointer text-link underline underline-offset-2" onClick={() => drillFor(r, 'OPEN_FORECAST_GP')}>
                  {aed(r.openGP)}
                </button>
              </TableCell>
              <TableCell className={cn('text-right font-medium tabular-nums', r.gap === null || r.gap === undefined ? 'text-muted-foreground' : r.gap > 0 ? 'text-negative' : 'text-positive')}>
                {r.gap === null || r.gap === undefined ? '—' : r.gap < 0 ? `Exceeded by ${aed(-r.gap)}` : aed(r.gap)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {r.winRate === null || r.winRate === undefined ? <span className="text-muted-foreground">No closed deals</span> : `${percent(r.winRate)} (${r.won}/${r.won + r.lost})`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <button
                  type="button"
                  className="min-h-6 cursor-pointer text-link underline underline-offset-2"
                  onClick={() => navigate({ pathname: '/exceptions', search: withParam(params, 'cm', r.name) })}
                >
                  {r.exceptionCount}
                </button>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => select(r)} aria-label={`Open CM360 for ${r.name}`}>
                  Open CM360 <ArrowRightIcon aria-hidden />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Win rate = won ÷ (won + lost) by actual close in the period; cancelled and disqualified deals are left out of the denominator (pending ARC sign-off). Gap = target − achieved.
        Choosing a manager sets the Client manager filter for every screen and is kept in the link.
      </p>
    </>
  );
}

function withParam(params: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(params);
  next.set(key, value);
  return `?${next.toString()}`;
}
