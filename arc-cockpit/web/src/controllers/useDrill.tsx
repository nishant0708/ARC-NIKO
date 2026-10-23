import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { DrillGroup, DrillMeasure, FiltersInput } from '@/models/gql/graphql';

/**
 * Drill-through state. Any figure can open the sheet that lists the exact records behind it,
 * with the governing date and exclusions returned by the server.
 */
export type DrillRequest =
  | { kind: 'measure'; filters: FiltersInput; measure: DrillMeasure; groupBy?: DrillGroup; bucket?: string }
  | { kind: 'targets'; filters: FiltersInput }
  | { kind: 'opportunity'; guid: string };

interface DrillState {
  current: DrillRequest | null;
  previous: DrillRequest | null;
}

const DrillContext = createContext<{
  state: DrillState;
  open: (r: DrillRequest) => void;
  openOpportunity: (guid: string) => void;
  back: () => void;
  close: () => void;
} | null>(null);

export function DrillProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrillState>({ current: null, previous: null });

  const open = useCallback((r: DrillRequest) => setState({ current: r, previous: null }), []);
  const openOpportunity = useCallback(
    (guid: string) =>
      setState((s) => ({ current: { kind: 'opportunity', guid }, previous: s.current && s.current.kind !== 'opportunity' ? s.current : null })),
    [],
  );
  const back = useCallback(() => setState((s) => ({ current: s.previous, previous: null })), []);
  const close = useCallback(() => setState({ current: null, previous: null }), []);

  return <DrillContext.Provider value={{ state, open, openOpportunity, back, close }}>{children}</DrillContext.Provider>;
}

export function useDrill() {
  const ctx = useContext(DrillContext);
  if (!ctx) throw new Error('useDrill must be used inside DrillProvider');
  return ctx;
}
