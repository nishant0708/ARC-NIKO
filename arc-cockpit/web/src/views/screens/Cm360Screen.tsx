import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useCm360 } from '@/controllers/useScreens';
import { useFilters, useOptions } from '@/controllers/useFilters';
import { useDrill } from '@/controllers/useDrill';
import { aed, count, date, initials, percent, RECORD_STATUS_LABEL } from '@/models/format';
import { Button } from '@/views/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/views/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/views/ui/chart';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/views/ui/table';
import { KpiCard } from '@/views/components/KpiCard';
import { Notice } from '@/views/components/Notice';
import { ChartCard } from '@/views/components/ChartCard';
import { OpportunityCell, StatusBadge } from '@/views/components/OpportunityBits';
import { ErrorNotice, LoadingGrid } from '@/views/components/QueryState';
import { PageHeader } from '@/views/components/PageHeader';
import { ActiveFilters } from '@/views/layout/ActiveFilters';

const trendConfig: ChartConfig = {
  won: { label: 'Won', color: 'var(--chart-1)' },
  lost: { label: 'Lost', color: 'var(--chart-2)' },
};

export function Cm360Screen() {
  const f = useFilters();
  const { data: opts } = useOptions();
  const { data, loading, error } = useCm360();
  const { open } = useDrill();
  const filters = f.input;
  const header = <PageHeader title="CM360 · Win/Loss" question="What happened across this manager’s deals, and why were they won or lost where the data supports an explanation?" />;

  if (!f.clientManager) {
    return (
      <>
        {header}
        <Card>
          <CardHeader>
            <CardTitle>Choose a client manager</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-[13px] text-foreground/85">CM360 shows one manager at a time. The choice sets the Client manager filter, is kept across screens and in the link.</p>
            <ul className="flex flex-wrap gap-2">
              {opts?.options.clientManagers
                .filter((m) => m.mapped)
                .map((m) => (
                  <li key={m.name}>
                    <Button variant="outline" size="sm" onClick={() => f.setClientManager(m.name)}>
                      {m.name}
                    </Button>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      </>
    );
  }
  if (error) return <>{header}<ErrorNotice error={error} /></>;
  if (loading && !data) return <>{header}<LoadingGrid cards={5} /></>;
  if (!data?.cm360) return header;
  const c = data.cm360;
  const scopeText = `${c.periodLabel} · as of ${c.asOf}`;

  return (
    <>
      {header}
      <ActiveFilters />
      <div className="flex flex-wrap items-center gap-3">
        <div aria-hidden className="flex size-10 items-center justify-center rounded-full border bg-muted font-semibold">
          {initials(c.clientManager)}
        </div>
        <div className="flex-1">
          <p className="text-[17px] font-semibold">{c.clientManager}</p>
          <p className="text-xs text-muted-foreground">
            {c.mapped ? 'Client manager' : 'Unmapped name'} · {c.opportunityCount} opportunities in view · {scopeText}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => f.setClientManager('')}>
          Change manager
        </Button>
      </div>
      {!c.mapped && (
        <Notice tone="warning" title="Unmapped manager">
          This name is not in the client manager directory, so target and gap cannot be shown. It is listed under Exceptions.
        </Notice>
      )}

      <h2 className="text-[15px] font-semibold">Performance summary</h2>
      <section aria-label="Performance summary" className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <KpiCard size="md" label="GP target" value={c.target.value === null || c.target.value === undefined ? 'Not recorded' : aed(c.target.value)} footer={<Small>{count(c.target.goalCount, 'goal record')} · {c.target.scope.note ?? scopeText}</Small>} onOpen={() => open({ kind: 'targets', filters })} />
        <KpiCard size="md" label="Achieved GP" value={aed(c.achieved.value)} footer={<Small>{c.achieved.count} won · by actual close</Small>} onOpen={() => open({ kind: 'measure', filters, measure: 'ACHIEVED_GP' })} />
        <KpiCard
          size="md"
          label="GP gap"
          value={c.gap.value === null || c.gap.value === undefined ? '—' : c.gap.exceeded ? `Exceeded by ${aed(-c.gap.value)}` : aed(c.gap.value)}
          footer={<Small>{c.gap.attainment === null || c.gap.attainment === undefined ? 'Needs a target' : `${percent(c.gap.attainment)} of target achieved`}</Small>}
          onOpen={() => open({ kind: 'measure', filters, measure: 'ACHIEVED_GP' })}
        />
        <KpiCard size="md" label="Open forecast GP" value={aed(c.openForecast.value)} footer={<Small>{c.openForecast.count} open · by estimated close</Small>} onOpen={() => open({ kind: 'measure', filters, measure: 'OPEN_FORECAST_GP' })} />
        <KpiCard size="md" label="Weighted open GP" value={aed(c.weightedOpen.value)} footer={<Small>× recorded probability</Small>} onOpen={() => open({ kind: 'measure', filters, measure: 'WEIGHTED_OPEN_GP' })} />
      </section>

      <h2 className="text-[15px] font-semibold">Win / loss</h2>
      <section aria-label="Win and loss" className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
        <KpiCard size="md" label="Won deals" value={String(c.won.count)} footer={<Small>{scopeText}</Small>} onOpen={() => open({ kind: 'measure', filters, measure: 'ACHIEVED_GP' })} />
        <KpiCard size="md" label="Lost deals" value={String(c.lost.count)} footer={<Small>{scopeText}</Small>} onOpen={() => open({ kind: 'measure', filters, measure: 'LOST_DEALS' })} />
        <KpiCard size="md" label="Win rate" value={c.winRate === null || c.winRate === undefined ? 'No closed deals' : percent(c.winRate)} footer={<Small>Won ÷ (won + lost)</Small>} onOpen={() => open({ kind: 'measure', filters, measure: 'CLOSED_DEALS' })} />
        <KpiCard size="md" label="Won GP" value={aed(c.won.value)} footer={<Small>Actual GP</Small>} onOpen={() => open({ kind: 'measure', filters, measure: 'ACHIEVED_GP' })} />
        <KpiCard size="md" label="Lost-at-estimate GP" value={aed(c.lost.value)} footer={<Small>Estimate only, not realised GP</Small>} onOpen={() => open({ kind: 'measure', filters, measure: 'LOST_DEALS' })} />
        <KpiCard
          size="md"
          label="Median sales cycle"
          value={c.medianSalesCycleDays === null || c.medianSalesCycleDays === undefined ? 'Not available' : `${Math.round(c.medianSalesCycleDays)} days`}
          footer={<Small>{count(c.salesCycleSample, 'deal')} with both dates</Small>}
          onOpen={() => open({ kind: 'measure', filters, measure: 'CLOSED_DEALS' })}
        />
      </section>
      <Notice>
        {c.winRateTreatment} {c.winRateExcludedCount} cancelled or disqualified deals fall in this period. Loss reasons and competitors are not recorded in the
        export, and stage at loss needs snapshot history, so they show as not recorded or not producible.
      </Notice>

      <ChartCard
        title="Outcome trend"
        description={`Won and lost deals by actual-close month · FY2026 · as of ${c.asOf}`}
        rows={c.trend.filter((t) => !t.afterAsOf).map((t) => ({ key: t.month, label: `${t.label} 2026`, value: String(t.won), extra: String(t.lost) }))}
        valueHeader="Won"
        extraHeader="Lost"
      >
        <ChartContainer config={trendConfig} className="aspect-auto h-[220px] w-full" role="img" aria-label={`Won and lost deals by month: ${c.trend.filter((t) => !t.afterAsOf).map((t) => `${t.label} ${t.won} won, ${t.lost} lost`).join('; ')}`}>
          <BarChart data={c.trend.map((t) => ({ ...t, won: t.afterAsOf ? 0 : t.won, lost: t.afterAsOf ? 0 : t.lost }))} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="won" fill="var(--color-won)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="lost" fill="var(--color-lost)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <section aria-labelledby="cm-deals" className="flex flex-col gap-2">
        <div>
          <h2 id="cm-deals" className="text-[15px] font-semibold">Closed deals in the period</h2>
          <p className="text-xs text-muted-foreground">{c.deals.length} won and lost deals · lost deals show estimated GP · {scopeText}</p>
        </div>
        <Table>
          <TableCaption>Won and lost deals for {c.clientManager}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Opportunity</TableHead>
              <TableHead scope="col">Outcome</TableHead>
              <TableHead scope="col">Actual close</TableHead>
              <TableHead scope="col" className="text-right">GP</TableHead>
              <TableHead scope="col" className="text-right">Sales cycle</TableHead>
              <TableHead scope="col">Loss reason</TableHead>
              <TableHead scope="col">Competitor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {c.deals.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                  No won or lost deals in this period.
                </TableCell>
              </TableRow>
            )}
            {c.deals.map((o) => (
              <TableRow key={o.guid}>
                <TableCell><OpportunityCell o={o} /></TableCell>
                <TableCell><StatusBadge group={o.statusGroup} label={o.statusGroup === 'WON' ? 'Won' : 'Lost'} /></TableCell>
                <TableCell className="whitespace-nowrap">{date(o.actualClose)}</TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">{o.statusGroup === 'WON' ? aed(o.actualGP) : `${aed(o.estimatedGP)} (est.)`}</TableCell>
                <TableCell className="text-right tabular-nums">{o.salesCycleDays === null || o.salesCycleDays === undefined ? 'Not available' : count(o.salesCycleDays, 'day')}</TableCell>
                <TableCell className="text-muted-foreground">{o.lossReason.value ?? RECORD_STATUS_LABEL[o.lossReason.status]}</TableCell>
                <TableCell className="text-muted-foreground">{o.competitor.value ?? RECORD_STATUS_LABEL[o.competitor.status]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  );
}

function Small({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}
