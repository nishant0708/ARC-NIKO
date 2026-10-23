import { useState } from 'react';
import { usePipeline } from '@/controllers/useScreens';
import { useFilters } from '@/controllers/useFilters';
import { useDrill } from '@/controllers/useDrill';
import { aed, aedFull, date } from '@/models/format';
import type { BucketFieldsFragment, DrillGroup } from '@/models/gql/graphql';
import { Button } from '@/views/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/views/ui/table';
import { KpiCard } from '@/views/components/KpiCard';
import { ScopeLine } from '@/views/components/ScopeLine';
import { ChartCard } from '@/views/components/ChartCard';
import { HBarChart } from '@/views/components/charts';
import { OpportunityCell, OpportunityFlags } from '@/views/components/OpportunityBits';
import { ErrorNotice, LoadingGrid } from '@/views/components/QueryState';
import { PageHeader } from '@/views/components/PageHeader';
import { ActiveFilters } from '@/views/layout/ActiveFilters';

const PAGE = 15;

export function PipelineScreen() {
  const { data, loading, error } = usePipeline();
  const f = useFilters();
  const { open } = useDrill();
  const [showAll, setShowAll] = useState(false);
  const filters = f.input;

  const header = <PageHeader title="Pipeline Health" question="What is genuinely in the pipeline, and which deals could make the forecast unreliable?" />;
  if (error) return <>{header}<ErrorNotice error={error} /></>;
  if (loading && !data) return <>{header}<LoadingGrid /></>;
  if (!data) return header;
  const p = data.pipeline;
  const shown = showAll ? p.opportunities : p.opportunities.slice(0, PAGE);

  const chart = (title: string, buckets: BucketFieldsFragment[], groupBy: DrillGroup) => (
    <ChartCard
      title={title}
      description={`${p.openGP.scope.periodLabel} · ${p.openGP.count} open deals · as of ${p.openGP.scope.asOf}`}
      rows={buckets.map((b) => ({ key: b.key, label: b.label, value: aedFull(b.value), extra: String(b.count), onOpen: () => open({ kind: 'measure', filters, measure: 'OPEN_FORECAST_GP', groupBy, bucket: b.key }) }))}
      valueHeader="Open GP"
      extraHeader="Deals"
    >
      {buckets.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-muted-foreground">No open deals in this scope.</p>
      ) : (
        <HBarChart
          ariaLabel={`${title}: ${buckets.map((b) => `${b.label} ${aed(b.value)}`).join(', ')}`}
          data={buckets.map((b) => ({ key: b.key, label: b.label, value: b.value, count: b.count }))}
          onSelect={(d) => open({ kind: 'measure', filters, measure: 'OPEN_FORECAST_GP', groupBy, bucket: d.key })}
        />
      )}
    </ChartCard>
  );

  return (
    <>
      {header}
      <ActiveFilters />
      <section aria-label="Summary measures" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        <KpiCard label="Open GP" value={aed(p.openGP.value)} note={`${p.openGP.count} open deals dated in the period`} footer={<ScopeLine scope={p.openGP.scope} showExclusions={false} />} onOpen={() => open({ kind: 'measure', filters, measure: 'OPEN_FORECAST_GP' })} />
        <KpiCard
          label="Weighted Open GP"
          value={aed(p.weightedOpenGP.value)}
          note={p.missingProbability ? `${p.missingProbability} deals without probability left out (flagged)` : 'Every open deal has a recorded probability'}
          footer={<ScopeLine scope={p.weightedOpenGP.scope} showExclusions={false} />}
          onOpen={() => open({ kind: 'measure', filters, measure: 'WEIGHTED_OPEN_GP' })}
        />
        <KpiCard label="Undated Opportunities" value={String(p.undated.count)} note={`${aed(p.undated.value)} est. GP with no close date`} footer={<ScopeLine scope={p.undated.scope} showExclusions={false} />} onOpen={() => open({ kind: 'measure', filters, measure: 'UNDATED_OPEN' })} />
        <KpiCard label="Overdue Opportunities" value={String(p.overdue.count)} note={`${aed(p.overdue.value)} est. GP past its close date`} footer={<ScopeLine scope={p.overdue.scope} showExclusions={false} />} onOpen={() => open({ kind: 'measure', filters, measure: 'OVERDUE_OPEN' })} />
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-3">
        {chart('Open GP by sales stage', p.byStage, 'STAGE')}
        {chart('Open GP by expected close month', p.byCloseMonth, 'CLOSE_MONTH')}
        {chart('Open GP by forecast category', p.byCategory, 'FORECAST_CATEGORY')}
      </div>

      <section aria-labelledby="pipe-table" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="pipe-table" className="text-[15px] font-semibold">Open opportunities</h2>
            <p className="text-xs text-muted-foreground">
              Showing {shown.length} of {p.opportunities.length}: dated in the period plus {p.undated.count} undated, largest estimated GP first · as of {p.openGP.scope.asOf}
            </p>
          </div>
          {p.opportunities.length > PAGE && (
            <Button variant="outline" size="sm" onClick={() => setShowAll((s) => !s)}>
              {showAll ? `Show top ${PAGE}` : `Show all ${p.opportunities.length}`}
            </Button>
          )}
        </div>
        <Table>
          <TableCaption>Open opportunities in the selected period</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Opportunity</TableHead>
              <TableHead scope="col">Client manager</TableHead>
              <TableHead scope="col">Stage</TableHead>
              <TableHead scope="col">Forecast category</TableHead>
              <TableHead scope="col" className="text-right">Est. GP</TableHead>
              <TableHead scope="col" className="text-right">Probability</TableHead>
              <TableHead scope="col">Est. close</TableHead>
              <TableHead scope="col">Flags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((o) => (
              <TableRow key={o.guid}>
                <TableCell><OpportunityCell o={o} /></TableCell>
                <TableCell>{o.clientManager}</TableCell>
                <TableCell>{o.stage}</TableCell>
                <TableCell>{o.forecastCategory ?? 'Not recorded'}</TableCell>
                <TableCell className="text-right tabular-nums">{aed(o.estimatedGP)}</TableCell>
                <TableCell className="text-right tabular-nums">{o.probability === null || o.probability === undefined ? 'Not recorded' : `${o.probability}%`}</TableCell>
                <TableCell className="whitespace-nowrap">{date(o.estimatedClose)}</TableCell>
                <TableCell><OpportunityFlags flags={o.flags} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">
          Overdue is calculated from the estimated close date against the as-of date, not read from a stored flag. Missing probabilities are flagged, never defaulted.
        </p>
      </section>
    </>
  );
}
