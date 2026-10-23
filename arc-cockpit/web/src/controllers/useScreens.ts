import { useQuery } from '@apollo/client';
import {
  CLIENT_MANAGERS_QUERY,
  CM360_QUERY,
  EXCEPTIONS_QUERY,
  EXECUTIVE_QUERY,
  PIPELINE_QUERY,
} from '@/models/queries';
import type { Severity } from '@/models/gql/graphql';
import { useFilters } from './useFilters';

/** One controller hook per screen: reads the URL filters and fetches that screen's view model. */

export function useExecutive() {
  const f = useFilters();
  return useQuery(EXECUTIVE_QUERY, { variables: { filters: f.input }, skip: !f.ready });
}

export function useClientManagers() {
  const f = useFilters();
  // The comparison table always shows every manager; the selected one is highlighted.
  return useQuery(CLIENT_MANAGERS_QUERY, { variables: { filters: f.input }, skip: !f.ready });
}

export function usePipeline() {
  const f = useFilters();
  return useQuery(PIPELINE_QUERY, { variables: { filters: f.input }, skip: !f.ready });
}

export function useCm360() {
  const f = useFilters();
  return useQuery(CM360_QUERY, { variables: { filters: f.input }, skip: !f.ready || !f.clientManager });
}

export function useExceptions() {
  const f = useFilters();
  const severity = (f.params.get('sev') as Severity | null) || null;
  const ruleId = f.params.get('rule') || null;
  const q = useQuery(EXCEPTIONS_QUERY, { variables: { filters: f.input, severity, ruleId }, skip: !f.ready });
  return { ...q, severity, ruleId, setSeverity: (v: string) => f.setParam('sev', v), setRule: (v: string) => f.setParam('rule', v) };
}
