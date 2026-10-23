import * as React from 'react';
import { cn } from '@/lib/utils';

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="relative w-full overflow-x-auto rounded-xl border bg-card">
      <table className={cn('w-full caption-bottom text-[13px]', className)} {...props} />
    </div>
  );
}
function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('bg-background [&_tr]:border-b', className)} {...props} />;
}
function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}
function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr className={cn('border-b border-border/60 transition-colors hover:bg-muted/40 data-[state=selected]:bg-selected', className)} {...props} />;
}
function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return <th className={cn('h-10 whitespace-nowrap px-3 text-left align-middle font-medium text-muted-foreground', className)} {...props} />;
}
function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return <td className={cn('px-3 py-2.5 align-top', className)} {...props} />;
}
function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return <caption className={cn('sr-only', className)} {...props} />;
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
