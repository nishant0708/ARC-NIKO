import { useQuery } from '@apollo/client';
import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { useDrill, type DrillRequest } from '@/controllers/useDrill';
import { DRILL_QUERY, OPPORTUNITY_QUERY, TARGETS_QUERY } from '@/models/queries';
import { aedFull, count, date, RECORD_STATUS_LABEL } from '@/models/format';
import type { FiltersInput, OpportunityFieldsFragment } from '@/models/gql/graphql';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/views/ui/sheet';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/views/ui/table';
import { Button } from '@/views/ui/button';
import { Skeleton } from '@/views/ui/skeleton';
import { Notice } from './Notice';
import { OpportunityCell, OpportunityFlags, StatusBadge } from './OpportunityBits';
import { ScopeLine } from './ScopeLine';

/** Drill-through sheet: the records behind a figure, its governing date and exclusions; or one deal's detail. */
export function DrillSheet() {
  const { state, close, back } = useDrill();
  const current = state.current;
  return (
    <Sheet open={!!current} onOpenChange={(o) => !o && close()}>
      <SheetContent aria-describedby={undefined}>
        {current?.kind === 'measure' && <MeasureDrill req={current} />}
        {current?.kind === 'targets' && <TargetsDrill filters={current.filters} />}
        {current?.kind === 'opportunity' && <OpportunityDetail guid={current.guid} onBack={state.previous ? back : undefined} />}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col gap-3 p-5" role="status" aria-label="Loading records">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-20" />
      <Skeleton className="h-64" />
    </div>
  );
}

function MeasureDrill({ req }: { req: Extract<DrillRequest, { kind: 'measure' }> }) {
  const { data, loading, error } = useQuery(DRILL_QUERY, {
    variables: { input: { filters: req.filters, measure: req.measure, groupBy: req.groupBy ?? null, bucket: req.bucket ?? null } },
  });
  if (loading && !data) return <Loading />;
  if (error || !data) return <div className="p-5"><Notice tone="warning" title="Could not load records">{error?.message}</Notice></div>;
  const d = data.drill;
  return (
    <>
      <SheetHeader>
        <SheetTitle>{d.title}</SheetTitle>
        <SheetDescription asChild>
          <div><ScopeLine scope={d.scope} showExclusions={false} /></div>
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <Stat label="Records" value={d.rows.length.toLocaleString('en-US')} />
          <Stat label={`Total ${d.amountLabel}`} value={aedFull(d.total)} />
          <Stat label="Governing date" value={d.governingDate} />
        </div>
        <Notice title="Excludes">{d.scope.exclusions.join('; ')}</Notice>
        {d.rows.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">No records match this figure.</p>
        ) : (
          <Table>
            <TableCaption>Records behind {d.title}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Opportunity</TableHead>
                <TableHead scope="col">Client manager</TableHead>
                <TableHead scope="col">{d.governingDate}</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="text-right">{d.amountLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.rows.map((r) => (
                <TableRow key={r.opportunity.guid}>
                  <TableCell><OpportunityCell o={r.opportunity} /></TableCell>
                  <TableCell>{r.opportunity.clientManager}</TableCell>
                  <TableCell className="whitespace-nowrap">{date(r.governingDateValue)}</TableCell>
                  <TableCell><StatusBadge group={r.opportunity.statusGroup} label={r.opportunity.statusReason} /></TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{aedFull(r.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

function TargetsDrill({ filters }: { filters: FiltersInput }) {
  const { data, loading, error } = useQuery(TARGETS_QUERY, { variables: { filters } });
  if (loading && !data) return <Loading />;
  if (error || !data) return <div className="p-5"><Notice tone="warning" title="Could not load targets">{error?.message}</Notice></div>;
  const t = data.targets;
  return (
    <>
      <SheetHeader>
        <SheetTitle>GP target records</SheetTitle>
        <SheetDescription asChild>
          <div><ScopeLine scope={t.scope} showExclusions={false} /></div>
        </SheetDescription>
      </SheetHeader>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
          <Stat label="Goal records" value={String(t.rows.length)} />
          <Stat label="Total target" value={t.total === null || t.total === undefined ? 'Not recorded' : aedFull(t.total)} />
          <Stat label="Governing date" value="Goal fiscal period" />
        </div>
        <Notice title="Excludes">{t.scope.exclusions.join('; ')}</Notice>
        {t.rows.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">No goal record exists for this manager and period.</p>
        ) : (
          <Table>
            <TableCaption>Goal records</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Client manager</TableHead>
                <TableHead scope="col">Period</TableHead>
                <TableHead scope="col">Metric</TableHead>
                <TableHead scope="col">Source</TableHead>
                <TableHead scope="col" className="text-right">Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {t.rows.map((g) => (
                <TableRow key={g.goalId}>
                  <TableCell className="font-medium">{g.owner}</TableCell>
                  <TableCell>{g.quarter} FY{g.fiscalYear}</TableCell>
                  <TableCell>{g.metric}</TableCell>
                  <TableCell className="text-muted-foreground">{g.source}</TableCell>
                  <TableCell className="text-right tabular-nums">{aedFull(g.targetAED)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

function OpportunityDetail({ guid, onBack }: { guid: string; onBack?: () => void }) {
  const { data, loading, error } = useQuery(OPPORTUNITY_QUERY, { variables: { guid } });
  if (loading && !data) return <Loading />;
  if (error || !data?.opportunity) return <div className="p-5"><Notice tone="warning" title="Could not load the opportunity">{error?.message ?? 'Not found'}</Notice></div>;
  const o = data.opportunity;
  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {o.opportunityId} · {o.account}
        </SheetTitle>
        <SheetDescription>CRM GUID {o.guid}</SheetDescription>
      </SheetHeader>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {onBack && (
          <Button variant="outline" size="sm" className="self-start" onClick={onBack}>
            <ArrowLeftIcon aria-hidden /> Back to the list
          </Button>
        )}
        <OpportunityFlags flags={o.flags} />
        <dl className="grid grid-cols-[minmax(140px,180px)_1fr] gap-x-4 gap-y-2 text-[13px]">
          {detailRows(o).map(([k, v, muted]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className={muted ? 'text-muted-foreground' : 'font-medium'}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}

function detailRows(o: OpportunityFieldsFragment): [string, string, boolean?][] {
  const rec = (r: { value?: string | null; status: string }) => r.value ?? RECORD_STATUS_LABEL[r.status] ?? r.status;
  return [
    ['Client manager', `${o.clientManager}${o.clientManagerMapped ? '' : ' (unmapped)'}`],
    ['CRM owner', o.owner ?? 'Not recorded'],
    ['Status reason', o.statusReason],
    ['Sales stage', o.stage],
    ['Forecast category', o.forecastCategory ?? 'Not recorded'],
    ['Probability', o.probability === null || o.probability === undefined ? 'Not recorded' : `${o.probability}%`],
    ['Estimated GP', aedFull(o.estimatedGP)],
    ['Actual GP', o.statusGroup === 'WON' ? aedFull(o.actualGP) : '—'],
    ['Created', date(o.createdOn)],
    ['Estimated close', date(o.estimatedClose)],
    ['Actual close', date(o.actualClose)],
    ['Sales cycle', o.salesCycleDays === null || o.salesCycleDays === undefined ? 'Not available' : count(o.salesCycleDays, 'day')],
    ['Vertical', o.vertical ?? 'Not recorded'],
    ['Loss reason', rec(o.lossReason), true],
    ['Competitor', rec(o.competitor), true],
    ['Stage at loss', rec(o.stageAtLoss), true],
  ];
}
