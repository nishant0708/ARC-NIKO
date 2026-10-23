import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/views/ui/card';
import { DonutChart, PALETTE, type ChartDatum } from './charts';

/** Donut with a legend of buttons: every slice is reachable by keyboard and shows its value and share. */
export function DonutCard({
  title,
  description,
  data,
  centerValue,
  centerLabel,
  format,
  onSelect,
}: {
  title: string;
  description: string;
  data: ChartDatum[];
  centerValue: string;
  centerLabel: string;
  format: (n: number) => string;
  onSelect: (d: ChartDatum) => void;
}) {
  const total = data.reduce((t, d) => t + d.value, 0);
  const share = (v: number) => (total ? `${Math.round((v / total) * 100)}%` : '0%');
  const aria = `${title}: ${data.map((d) => `${d.label} ${format(d.value)} (${share(d.value)})`).join(', ')}`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted-foreground">No records in this scope.</p>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <DonutChart data={data} ariaLabel={aria} centerValue={centerValue} centerLabel={centerLabel} onSelect={onSelect} format={format} />
            <ul className="flex w-full flex-col gap-0.5">
              {data.map((d, i) => (
                <li key={d.key}>
                  <button
                    type="button"
                    onClick={() => onSelect(d)}
                    className="grid min-h-7 w-full cursor-pointer grid-cols-[12px_1fr_auto_auto] items-center gap-2 rounded-md px-1.5 py-1 text-left text-[13px] hover:bg-muted"
                  >
                    <span aria-hidden className="size-3 rounded-[3px]" style={{ background: PALETTE[i % PALETTE.length] }} />
                    <span className="truncate">{d.label}</span>
                    <span className="tabular-nums">{format(d.value)}</span>
                    <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{share(d.value)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
