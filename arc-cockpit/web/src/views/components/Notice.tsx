import type { ReactNode } from 'react';
import { ExclamationTriangleIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

/** Warning or information banner. Meaning is carried by an icon and text, never colour alone. */
export function Notice({ tone = 'info', title, children, className }: { tone?: 'info' | 'warning'; title?: string; children: ReactNode; className?: string }) {
  const Icon = tone === 'warning' ? ExclamationTriangleIcon : InfoCircledIcon;
  return (
    <div
      role="note"
      className={cn(
        'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px]',
        tone === 'warning'
          ? 'border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn-fg)]'
          : 'border-border bg-muted/60 text-foreground/85',
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        {title && <strong className="font-semibold">{title}. </strong>}
        {children}
      </div>
    </div>
  );
}
