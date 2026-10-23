import { useExecutive } from '@/controllers/useScreens';
import { useFilters } from '@/controllers/useFilters';
import { useDrill } from '@/controllers/useDrill';
import { aed, aedFull, count, percent } from '@/models/format';
import { Button } from '@/views/ui/button';
import { KpiCard } from '@/views/components/KpiCard';
import { ScopeLine } from '@/views/components/ScopeLine';
import { Notice } from '@/views/components/Notice';
import { ChartCard } from '@/views/components/ChartCard';
import { DonutCard } from '@/views/components/DonutCard';
import { HBarChart, MonthBarChart } from '@/views/components/charts';
import { ErrorNotice, LoadingGrid } from '@/views/components/QueryState';
import { PageHeader } from '@/views/components/PageHeader';
import { ActiveFilters } from '@/views/layout/ActiveFilters';

export function ExecutiveScreen() {
  const { data, loading, error } = useExecutive();
  const f = useFilters();
  const { open } = useDrill();
  const filters = f.input;

  const header = <PageHeader title="Executive" question="Are we achieving our GP target, and how much potential business is in the pipeline?" />;
  if (error) return <>{header}<ErrorNotice error={error} /></>;
  if (loading && !data) return <>{header}<LoadingGrid /></>;
  if (!data) return header;
  const e = data.executive;

  const gapValue =
    e.gap.value === null || e.gap.value === undefined ? 'Not available' : e.gap.exceeded ? `Exceeded by ${aed(-e.gap.value)}` : aed(e.gap.value);
  const tvMax = Math.max(e.target.value ?? 0, e.achieved.value, 1);

  return (
    <>
      {header}
      <ActiveFilters />
      {e.warnings.map((w) => (
        <Notice key={w.message} tone="warning" title={w.title}>
          {w.message}
        </Notice>
      ))}

      <section aria-label="Key figures" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        <KpiCard
          label="Quarterly GP Target"
          value={e.target.value === null || e.target.value === undefined ? 'Not recorded' : aed(e.target.value)}
          note={e.target.value === null || e.target.value === undefined ? 'No goal record for this scope' : `${aedFull(e.target.value)} · ${count(e.target.goalCount, 'goal record')}`}
          footer={<ScopeLine scope={e.target.scope} showExclusions={false} />}
          onOpen={() => open({ kind: 'targets', filters })}
        />
        <KpiCard
          label="Achieved GP"
          value={aed(e.achieved.value)}
          note={`${aedFull(e.achieved.value)} · ${e.achieved.count} won deals`}
          footer={<ScopeLine scope={e.achieved.scope} showExclusions={false} />}
          onOpen={() => open({ kind: 'measure', filters, measure: 'ACHIEVED_GP' })}
        />
        <KpiCard
          label="GP Gap to Target"
          value={gapValue}
          note={e.gap.attainment === null || e.gap.attainment === undefined ? 'Needs a target' : `${percent(e.gap.attainment)} of target achieved`}
          footer={<p className="text-xs text-muted-foreground">Target − achieved GP · {e.periodLabel} · as of {e.asOf}</p>}
          onOpen={() => open({ kind: 'measure', filters, measure: 'ACHIEVED_GP' })}
        />
        <KpiCard
          label="Open Forecast GP"
          value={aed(e.openForecast.value)}
          note={`${e.openForecast.count} open deals dated in the period`}
          footer={<ScopeLine scope={e.openForecast.scope} showExclusions={false} />}
          onOpen={() => open({ kind: 'measure', filters, measure: 'OPEN_FORECAST_GP' })}
        />
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-3">
        <ChartCard
          title="Achieved GP by actual-close month"
          description={`FY2026 · won deals only · selected period in colour, other months grey · as of ${e.asOf}`}
          rows={e.achievedByMonth
            .filter((m) => !m.afterAsOf)
            .map((m) => ({ key: m.month, label: `${m.label} 2026`, value: aedFull(m.value), extra: String(m.count), onOpen: () => open({ kind: 'measure', filters: { ...filters, period: '2026-FY' }, measure: 'ACHIEVED_GP', groupBy: 'MONTH', bucket: m.month }) }))}
          valueHeader="Achieved GP"
          extraHeader="Won deals"
        >
          <MonthBarChart
            ariaLabel={`Achieved GP by month: ${e.achievedByMonth.filter((m) => !m.afterAsOf).map((m) => `${m.label} ${aed(m.value)}`).join(', ')}`}
            data={e.achievedByMonth.map((m) => ({ key: m.month, label: m.label, value: m.afterAsOf ? 0 : m.value, count: m.count, highlight: m.inPeriod, future: m.afterAsOf }))}
            onSelect={(m) => !m.future && open({ kind: 'measure', filters: { ...filters, period: '2026-FY' }, measure: 'ACHIEVED_GP', groupBy: 'MONTH', bucket: m.key })}
          />
        </ChartCard>

        <ChartCard title="Target versus achieved GP" description="Each bar states its own period and scope. Monthly targets are never derived from the quarterly target.">
          <div className="flex flex-col gap-4 pt-2">
            {[
              { label: 'Target', value: e.target.value, color: 'var(--chart-6)', scope: [`${e.periodLabel} goal records`, `${e.target.managerCount} managers`, e.target.scope.note].filter(Boolean).join(' · '), onOpen: () => open({ kind: 'targets', filters }) },
              { label: 'Achieved', value: e.achieved.value, color: 'var(--chart-1)', scope: `${e.periodLabel} · actual close · ${e.achieved.count} won deals`, onOpen: () => open({ kind: 'measure', filters, measure: 'ACHIEVED_GP' }) },
            ].map((r) => (
              <div key={r.label} className="flex flex-col gap-1">
                <button type="button" onClick={r.onOpen} className="grid cursor-pointer grid-cols-[80px_1fr_110px] items-center gap-3 text-left text-[13px]">
                  <span className="font-medium">{r.label}</span>
                  <span className="h-3.5 overflow-hidden rounded bg-muted">
                    <span className="block h-full rounded" style={{ width: `${Math.max(2, ((r.value ?? 0) / tvMax) * 100)}%`, background: r.color }} />
                  </span>
                  <span className="text-right font-semibold tabular-nums">{r.value === null || r.value === undefined ? 'Not recorded' : aed(r.value)}</span>
                </button>
                <p className="pl-[92px] text-xs text-muted-foreground">{r.scope}</p>
              </div>
            ))}
            <p className="text-[13px] text-foreground/85">
              {e.gap.value === null || e.gap.value === undefined
                ? 'No target recorded for this scope.'
                : e.gap.exceeded
                  ? `Target exceeded by ${aedFull(-e.gap.value)}.`
                  : `${aedFull(e.gap.value)} still needed; open forecast in the period is ${aedFull(e.openForecast.value)}.`}
            </p>
          </div>
        </ChartCard>
      </div>

      <section aria-label="Composition" className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-3">
        <DonutCard
          title="Achieved GP by vertical"
          description={`${e.periodLabel} · won deals by actual close · as of ${e.asOf}`}
          data={e.achievedByVertical}
          centerValue={aed(e.achieved.value).replace('AED ', '')}
          centerLabel="achieved"
          format={aed}
          onSelect={(d) => open({ kind: 'measure', filters, measure: 'ACHIEVED_GP', groupBy: 'VERTICAL', bucket: d.key })}
        />
        <DonutCard
          title="Open forecast by category"
          description={`${e.periodLabel} · open deals by estimated close · as of ${e.asOf}`}
          data={e.openByCategory}
          centerValue={aed(e.openForecast.value).replace('AED ', '')}
          centerLabel="open GP"
          format={aed}
          onSelect={(d) => open({ kind: 'measure', filters, measure: 'OPEN_FORECAST_GP', groupBy: 'FORECAST_CATEGORY', bucket: d.key })}
        />
        <DonutCard
          title="Closed deal outcomes"
          description={`${e.periodLabel} · deals closed in the period, by count · as of ${e.asOf}`}
          data={e.closedOutcomes}
          centerValue={String(e.closedOutcomes.reduce((t, b) => t + b.count, 0))}
          centerLabel="deals"
          format={(n) => String(n)}
          onSelect={(d) => open({ kind: 'measure', filters, measure: 'CLOSED_DEALS', groupBy: 'OUTCOME', bucket: d.key })}
        />
      </section>

      <ChartCard
        title="Open forecast by estimated close month"
        description={<ScopeLine scope={e.openForecast.scope} />}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => open({ kind: 'measure', filters, measure: 'UNDATED_OPEN' })}>
              Undated: {e.undated.count} · {aed(e.undated.value)}
            </Button>
            <Button variant="outline" size="sm" onClick={() => open({ kind: 'measure', filters, measure: 'OVERDUE_OPEN' })}>
              Overdue: {e.overdue.count} · {aed(e.overdue.value)}
            </Button>
          </div>
        }
        rows={e.openByCloseMonth.map((b) => ({ key: b.key, label: b.label + (b.flag === 'OVERDUE' ? ' (overdue)' : ''), value: aedFull(b.value), extra: String(b.count), onOpen: () => open({ kind: 'measure', filters, measure: 'OPEN_FORECAST_GP', groupBy: 'CLOSE_MONTH', bucket: b.key }) }))}
        valueHeader="Open GP"
        extraHeader="Deals"
      >
        {e.openByCloseMonth.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">No open deals are dated in this period.</p>
        ) : (
          <HBarChart
            ariaLabel={`Open forecast by month: ${e.openByCloseMonth.map((b) => `${b.label} ${aed(b.value)}`).join(', ')}`}
            data={e.openByCloseMonth.map((b) => ({ key: b.key, label: b.label + (b.flag === 'OVERDUE' ? ' · overdue' : ''), value: b.value, count: b.count, fill: b.flag === 'OVERDUE' ? 'var(--chart-2)' : undefined }))}
            onSelect={(d) => open({ kind: 'measure', filters, measure: 'OPEN_FORECAST_GP', groupBy: 'CLOSE_MONTH', bucket: d.key })}
          />
        )}
      </ChartCard>
    </>
  );
}
