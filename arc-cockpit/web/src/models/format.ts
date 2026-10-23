/**
 * Display formatting only. No KPI is calculated here; values arrive computed from the server.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function aed(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const a = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (a >= 1e6) return `${sign}AED ${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}AED ${Math.round(a / 1e3)}K`;
  return `${sign}AED ${Math.round(a)}`;
}

export function aedShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(Math.round(n));
}

export function aedFull(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `AED ${Math.round(n).toLocaleString('en-US')}`;
}

export function percent(n: number | null | undefined, digits = 0): string {
  if (n === null || n === undefined) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

export function date(iso: string | null | undefined): string {
  if (!iso) return 'Not recorded';
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

export function count(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((p) => /[A-Za-z]/.test(p))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export const FLAG_LABEL: Record<string, string> = {
  UNDATED: 'Undated',
  OVERDUE: 'Overdue',
  PROBABILITY_NOT_RECORDED: 'Probability not recorded',
  UNMAPPED_MANAGER: 'Unmapped manager',
};

export const RECORD_STATUS_LABEL: Record<string, string> = {
  RECORDED: '',
  NOT_RECORDED: 'Not recorded',
  NOT_PRODUCIBLE: 'Not producible (no snapshot history)',
  NOT_APPLICABLE: '—',
};
