import { GraphQLError } from 'graphql';
import type { Period, Quarter } from './types.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

function lastDay(year: number, month1: number): string {
  const d = new Date(Date.UTC(year, month1, 0)).getUTCDate();
  return `${year}-${String(month1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Fiscal year = calendar year (Q1 = Jan–Mar), as confirmed for ARC. */
export function periodsFor(year: number): Period[] {
  const qs = QUARTERS.map((q, i) => {
    const m0 = i * 3 + 1;
    return {
      id: `${year}-${q}`,
      label: `${q} FY${year} (${MONTHS[m0 - 1]}–${MONTHS[m0 + 1]})`,
      short: `${q} FY${year}`,
      start: `${year}-${String(m0).padStart(2, '0')}-01`,
      end: lastDay(year, m0 + 2),
      quarters: [q],
    } satisfies Period;
  });
  const fy: Period = {
    id: `${year}-FY`,
    label: `FY${year} (Jan–Dec)`,
    short: `FY${year}`,
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    quarters: [...QUARTERS],
  };
  return [...qs, fy];
}

export function resolvePeriod(id: string, year: number): Period {
  const p = periodsFor(year).find((x) => x.id === id);
  if (!p) throw new GraphQLError(`Unknown fiscal period "${id}"`, { extensions: { code: 'BAD_USER_INPUT' } });
  return p;
}

export function inPeriod(date: string | null, p: Period): boolean {
  return !!date && date >= p.start && date <= p.end;
}

export function monthLabel(yyyyMm: string): string {
  return `${MONTHS[Number(yyyyMm.slice(5, 7)) - 1]} ${yyyyMm.slice(0, 4)}`;
}

export function monthsOfYear(year: number): { key: string; label: string; start: string; end: string }[] {
  return MONTHS.map((m, i) => ({
    key: `${year}-${String(i + 1).padStart(2, '0')}`,
    label: m,
    start: `${year}-${String(i + 1).padStart(2, '0')}-01`,
    end: lastDay(year, i + 1),
  }));
}

export function formatAsOf(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}
