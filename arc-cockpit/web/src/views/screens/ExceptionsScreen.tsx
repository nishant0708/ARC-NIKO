import { useId, useState } from 'react';
import { useExceptions } from '@/controllers/useScreens';
import { aed } from '@/models/format';
import { Badge } from '@/views/ui/badge';
import { Button } from '@/views/ui/button';
import { Label } from '@/views/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/views/ui/select';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/views/ui/table';
import { KpiCard } from '@/views/components/KpiCard';
import { Notice } from '@/views/components/Notice';
import { ChartCard } from '@/views/components/ChartCard';
import { HBarChart } from '@/views/components/charts';
import { OpportunityCell } from '@/views/components/OpportunityBits';
import { ErrorNotice, LoadingGrid } from '@/views/components/QueryState';
import { PageHeader } from '@/views/components/PageHeader';
import { ActiveFilters } from '@/views/layout/ActiveFilters';

const ALL = '__all__';
const PAGE = 25;
const SEV_LABEL = { HIGH: 'High', MEDIUM: 'Medium' } as const;

export function ExceptionsScreen() {
  const x = useExceptions();
  const ids = { sev: useId(), rule: useId() };
  const [showAll, setShowAll] = useState(false);
  const header = <PageHeader title="Exceptions" question="Which records or business conditions require investigation or a decision?" />;
  if (x.error) return <>{header}<ErrorNotice error={x.error} /></>;
  if (x.loading && !x.data) return <>{header}<LoadingGrid /></>;
  if (!x.data) return header;
  const v = x.data.exceptions;
  const shown = showAll ? v.items : v.items.slice(0, PAGE);
  const sevCount = (s: 'HIGH' | 'MEDIUM') => v.bySeverity.find((b) => b.severity === s)?.count ?? 0;

  return (
    <>
      {header}
      <ActiveFilters />
      <Notice>
        These are objective data-quality and decision signals, evaluated on every record as of {v.asOf}. They describe records, not a person’s performance.
      </Notice>

      <section aria-label="Exception summary" className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <KpiCard label="Triggered exceptions" value={String(v.total)} footer={<Small>All rules · all periods · as of {v.asOf}</Small>} onOpen={() => { x.setSeverity(''); x.setRule(''); }} />
        <KpiCard label="High severity" value={String(sevCount('HIGH'))} footer={<Small>Needs attention first</Small>} onOpen={() => x.setSeverity('HIGH')} />
        <KpiCard label="Medium severity" value={String(sevCount('MEDIUM'))} footer={<Small>Review in the weekly cycle</Small>} onOpen={() => x.setSeverity('MEDIUM')} />
        <KpiCard label="GP exposure (open deals)" value={aed(v.gpExposure)} footer={<Small>Est. GP of open deals with at least one exception, each deal counted once</Small>} />
      </section>

      <ChartCard
        title="Exceptions by rule"
        description={`All periods · as of ${v.asOf}`}
        rows={v.byRule.map((r) => ({ key: r.rule.id, label: `${r.rule.id} · ${r.rule.name}`, value: String(r.count), onOpen: () => x.setRule(r.rule.id) }))}
        valueHeader="Records"
      >
        <HBarChart
          ariaLabel={`Exceptions by rule: ${v.byRule.map((r) => `${r.rule.name} ${r.count}`).join(', ')}`}
          data={v.byRule.map((r) => ({ key: r.rule.id, label: `${r.rule.id} · ${r.rule.name}`, value: r.count, fill: r.rule.severity === 'HIGH' ? 'var(--chart-2)' : 'var(--chart-5)' }))}
          format={(n) => String(n)}
          onSelect={(d) => x.setRule(d.key)}
        />
      </ChartCard>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex w-[180px] flex-col gap-1">
          <Label id={ids.sev}>Severity</Label>
          <Select value={x.severity ?? ALL} onValueChange={(s) => x.setSeverity(s === ALL ? '' : s)}>
            <SelectTrigger aria-labelledby={ids.sev}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All severities</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[300px] flex-col gap-1">
          <Label id={ids.rule}>Rule</Label>
          <Select value={x.ruleId ?? ALL} onValueChange={(r) => x.setRule(r === ALL ? '' : r)}>
            <SelectTrigger aria-labelledby={ids.rule}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All rules</SelectItem>
              {v.rules.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.id} · {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p role="status" className="pb-2 text-[13px] font-medium">
          Showing {shown.length} of {v.filteredTotal} filtered · {v.total} total
        </p>
      </div>

      <Table>
        <TableCaption>Triggered exceptions</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Rule / exception</TableHead>
            <TableHead scope="col">Source field</TableHead>
            <TableHead scope="col">Affected record</TableHead>
            <TableHead scope="col">Client manager</TableHead>
            <TableHead scope="col">Severity</TableHead>
            <TableHead scope="col" className="text-right">GP exposure</TableHead>
            <TableHead scope="col">As-of date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                No exceptions match these filters.
              </TableCell>
            </TableRow>
          )}
          {shown.map((i) => (
            <TableRow key={i.id}>
              <TableCell>
                <span className="font-medium">{i.rule.id}</span> {i.rule.name}
              </TableCell>
              <TableCell>
                <code className="text-xs">{i.rule.sourceField}</code>
              </TableCell>
              <TableCell><OpportunityCell o={i.opportunity} /></TableCell>
              <TableCell>{i.opportunity.clientManager}</TableCell>
              <TableCell>
                <Badge variant={i.severity === 'HIGH' ? 'high' : 'medium'}>{SEV_LABEL[i.severity]}</Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">{i.gpExposure === null || i.gpExposure === undefined ? '—' : aed(i.gpExposure)}</TableCell>
              <TableCell className="whitespace-nowrap">{i.asOf}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {v.items.length > PAGE && (
        <Button variant="outline" size="sm" className="self-start" onClick={() => setShowAll((s) => !s)}>
          {showAll ? `Show first ${PAGE}` : `Show all ${v.items.length}`}
        </Button>
      )}
    </>
  );
}

function Small({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}
