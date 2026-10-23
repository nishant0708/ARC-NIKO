import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A clickable figure. The whole card is a native button so it works with keyboard and screen readers;
 * activating it opens the drill-through for the records behind the number.
 */
export function KpiCard({
  label,
  value,
  note,
  footer,
  onOpen,
  size = 'lg',
}: {
  label: string;
  value: string;
  note?: ReactNode;
  footer?: ReactNode;
  onOpen?: () => void;
  size?: 'lg' | 'md';
}) {
  const body = (
    <>
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <span className={cn('font-semibold tracking-tight', size === 'lg' ? 'text-[26px] leading-8' : 'text-[22px] leading-7')}>{value}</span>
      {note && <span className="text-[13px] text-foreground/80">{note}</span>}
      {footer && <span className="mt-1 block">{footer}</span>}
    </>
  );
  const cls = 'flex h-full w-full flex-col items-start gap-1 rounded-xl border bg-card p-4 text-left text-card-foreground';
  if (!onOpen) return <div className={cls}>{body}</div>;
  return (
    <button type="button" onClick={onOpen} className={cn(cls, 'cursor-pointer transition-colors hover:border-foreground/30')}>
      {body}
      <span className="sr-only">. Show the records behind this figure.</span>
    </button>
  );
}
