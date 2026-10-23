import type { ApolloError } from '@apollo/client';
import { Skeleton } from '@/views/ui/skeleton';
import { Notice } from './Notice';

export function LoadingGrid({ cards = 4 }: { cards?: number }) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export function ErrorNotice({ error }: { error: ApolloError }) {
  return (
    <div role="alert">
      <Notice tone="warning" title="Could not load data">
        {error.message}. Check that the GraphQL server is running, then reload.
      </Notice>
    </div>
  );
}
