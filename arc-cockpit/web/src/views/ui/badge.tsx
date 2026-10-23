import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium', {
  variants: {
    variant: {
      outline: 'bg-card text-foreground/80',
      high: 'bg-[var(--sev-high-bg)] border-[var(--sev-high-border)] text-[var(--sev-high-fg)]',
      medium: 'bg-[var(--sev-med-bg)] border-[var(--sev-med-border)] text-[var(--sev-med-fg)]',
      info: 'bg-[var(--info-bg)] border-[var(--info-border)] text-[var(--info-fg)]',
      secondary: 'bg-secondary border-transparent text-secondary-foreground',
    },
  },
  defaultVariants: { variant: 'outline' },
});

function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
