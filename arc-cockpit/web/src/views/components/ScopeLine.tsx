import { cn } from '@/lib/utils';
import type { ScopeFieldsFragment } from '@/models/gql/graphql';

/** Every figure states its period, record count, governing date, exclusions and as-of time. */
export function ScopeLine({ scope, className, showExclusions = true }: { scope: ScopeFieldsFragment; className?: string; showExclusions?: boolean }) {
  return (
    <p className={cn('text-xs leading-relaxed text-muted-foreground', className)}>
      {scope.periodLabel} · {scope.recordCount.toLocaleString('en-US')} records · {scope.governingDate} · as of {scope.asOf}
      {showExclusions && scope.exclusions.length > 0 && (
        <>
          <br />
          Excludes: {scope.exclusions.join('; ')}
        </>
      )}
      {scope.note && (
        <>
          <br />
          {scope.note}
        </>
      )}
    </p>
  );
}
