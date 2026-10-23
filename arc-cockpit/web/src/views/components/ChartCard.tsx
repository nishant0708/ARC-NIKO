import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/views/ui/card';

export interface DataRow {
  key: string;
  label: string;
  value: string;
  extra?: string;
  onOpen?: () => void;
}

/**
 * A chart in a card. Under each chart, "View as table" gives the same numbers as a keyboard-friendly
 * list, so nothing depends on seeing or clicking the chart itself.
 */
export function ChartCard({
  title,
  description,
  children,
  rows,
  valueHeader = 'Value',
  extraHeader,
  action,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  rows?: DataRow[];
  valueHeader?: string;
  extraHeader?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {children}
        {rows && rows.length > 0 && (
          <details className="group text-[13px]">
            <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">View as table</summary>
            <table className="mt-2 w-full">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-1.5 font-medium">Group</th>
                  <th scope="col" className="py-1.5 text-right font-medium">{valueHeader}</th>
                  {extraHeader && <th scope="col" className="py-1.5 text-right font-medium">{extraHeader}</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5">
                      {r.onOpen ? (
                        <button type="button" onClick={r.onOpen} className="cursor-pointer text-left text-link underline underline-offset-2">
                          {r.label}
                        </button>
                      ) : (
                        r.label
                      )}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">{r.value}</td>
                    {extraHeader && <td className="py-1.5 text-right tabular-nums">{r.extra}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
