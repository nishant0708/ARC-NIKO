import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { OPTIONS_QUERY } from '@/models/queries';
import type { FiltersInput } from '@/models/gql/graphql';

/**
 * Global filters live in the URL, so they survive navigation and reload and can be shared as a link.
 * Keys: period, cm, vertical, q. Screen-level keys (sev, rule) use the same mechanism.
 */
export const FILTER_KEYS = ['period', 'cm', 'vertical', 'q'] as const;

export function useOptions() {
  return useQuery(OPTIONS_QUERY, { fetchPolicy: 'cache-first' });
}

export function useFilters() {
  const [params, setParams] = useSearchParams();
  const { data: options } = useOptions();
  const defaultPeriod = options?.options.defaultPeriod;

  const period = params.get('period') || defaultPeriod || '';
  const clientManager = params.get('cm') ?? '';
  const vertical = params.get('vertical') ?? '';
  const search = params.get('q') ?? '';

  const setParam = useCallback(
    (key: string, value: string | null | undefined) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: key === 'q' },
      );
    },
    [setParams],
  );

  const setMany = useCallback(
    (values: Record<string, string | null>) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(values).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        return next;
      });
    },
    [setParams],
  );

  const reset = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      FILTER_KEYS.forEach((k) => next.delete(k));
      return next;
    });
  }, [setParams]);

  const input: FiltersInput = useMemo(
    () => ({ period, clientManager: clientManager || null, vertical: vertical || null, search: search || null }),
    [period, clientManager, vertical, search],
  );

  return {
    ready: !!period,
    period,
    clientManager,
    vertical,
    search,
    input,
    params,
    setPeriod: (v: string) => setParam('period', v),
    setClientManager: (v: string) => setParam('cm', v),
    setVertical: (v: string) => setParam('vertical', v),
    setSearch: (v: string) => setParam('q', v),
    setParam,
    setMany,
    reset,
  };
}
