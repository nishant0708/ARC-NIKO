import type { ReactNode } from 'react';

export function PageHeader({ title, question, children }: { title: string; question: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{question}</p>
      </div>
      {children}
    </div>
  );
}
