import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/views/ui/chart';
import { aed, aedShort } from '@/models/format';

/** Reusable chart views built on the shadcn chart component. Inputs are server-computed buckets. */

export const PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

export interface ChartDatum {
  key: string;
  label: string;
  value: number;
  count?: number;
  fill?: string;
}

/** Horizontal bars, one per group. Clicking a bar opens its records. */
export function HBarChart({
  data,
  ariaLabel,
  onSelect,
  format = aed,
  height,
}: {
  data: ChartDatum[];
  ariaLabel: string;
  onSelect?: (d: ChartDatum) => void;
  format?: (n: number) => string;
  height?: number;
}) {
  const config: ChartConfig = { value: { label: 'Value', color: 'var(--chart-1)' } };
  const h = height ?? Math.max(120, data.length * 36 + 24);
  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: h }} role="img" aria-label={ariaLabel}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 56, top: 4, bottom: 4 }} accessibilityLayer>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" width={140} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v, _n, item) => <TooltipLine label={item.payload.label} value={format(Number(v))} count={item.payload.count} />} />} />
        <Bar
          dataKey="value"
          radius={4}
          fill="var(--color-value)"
          cursor={onSelect ? 'pointer' : undefined}
          onClick={(d: { payload?: ChartDatum }) => d.payload && onSelect?.(d.payload)}
          label={{ position: 'right', formatter: (v: number) => format(v).replace('AED ', ''), fontSize: 11, fill: 'var(--muted-foreground)' }}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.fill ?? 'var(--color-value)'} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export interface MonthDatum {
  key: string;
  label: string;
  value: number;
  count: number;
  highlight: boolean;
  future: boolean;
}

/** Vertical bars by month. The selected period is coloured; other months are muted; months after as-of are empty. */
export function MonthBarChart({ data, ariaLabel, onSelect }: { data: MonthDatum[]; ariaLabel: string; onSelect?: (d: MonthDatum) => void }) {
  const config: ChartConfig = { value: { label: 'Achieved GP', color: 'var(--chart-1)' } };
  return (
    <ChartContainer config={config} className="aspect-auto h-[220px] w-full" role="img" aria-label={ariaLabel}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 16, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => aedShort(v)} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v, _n, item) => <TooltipLine label={`${item.payload.label} 2026`} value={aed(Number(v))} count={item.payload.count} />} />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} cursor={onSelect ? 'pointer' : undefined} onClick={(d: { payload?: MonthDatum }) => d.payload && onSelect?.(d.payload)}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.highlight ? 'var(--chart-1)' : 'var(--chart-muted)'} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/** Donut (pie) with a centre total. Colours follow the legend order. */
export function DonutChart({
  data,
  ariaLabel,
  centerValue,
  centerLabel,
  onSelect,
  format = aed,
}: {
  data: ChartDatum[];
  ariaLabel: string;
  centerValue: string;
  centerLabel: string;
  onSelect?: (d: ChartDatum) => void;
  format?: (n: number) => string;
}) {
  const config: ChartConfig = Object.fromEntries(data.map((d, i) => [d.key, { label: d.label, color: PALETTE[i % PALETTE.length] }]));
  return (
    <ChartContainer config={config} className="aspect-square h-[170px] shrink-0" role="img" aria-label={ariaLabel}>
      <PieChart>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(v, _n, item) => <TooltipLine label={item.payload.label} value={format(Number(v))} count={item.payload.count} />} />} />
        <Pie
          data={data.map((d, i) => ({ ...d, fill: PALETTE[i % PALETTE.length], 'aria-label': `${d.label}: ${format(d.value)}` }))}
          dataKey="value"
          nameKey="key"
          innerRadius={52}
          outerRadius={80}
          strokeWidth={2}
          stroke="var(--card)"
          cursor={onSelect ? 'pointer' : undefined}
          onClick={(d: { payload?: ChartDatum }) => d.payload && onSelect?.(d.payload)}
        >
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !('cx' in viewBox)) return null;
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-foreground text-[15px] font-semibold">
                    {centerValue}
                  </tspan>
                  <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 14} className="fill-muted-foreground text-[11px]">
                    {centerLabel}
                  </tspan>
                </text>
              );
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

function TooltipLine({ label, value, count }: { label: string; value: string; count?: number }) {
  return (
    <div className="flex w-full flex-col gap-0.5">
      <span className="font-medium">{label}</span>
      <span className="tabular-nums">
        {value}
        {count !== undefined && <span className="text-muted-foreground"> · {count} deals</span>}
      </span>
    </div>
  );
}
