import { describe, expect, it } from 'vitest';
import { executive } from '../src/controllers/executive.controller.js';
import { pipeline } from '../src/controllers/pipeline.controller.js';
import { exceptions } from '../src/controllers/exceptions.controller.js';
import { clientManagers } from '../src/controllers/clientManagers.controller.js';
import { drill } from '../src/controllers/drill.controller.js';
import { repository } from '../src/models/repository.js';
import { sum } from '../src/models/measures.js';

/**
 * Reconciliation controls: the model must reproduce the reference figures from the
 * PILOT export and the BRD before any screen is trusted.
 */
describe('reconciliation to the PILOT export', () => {
  const repo = repository();

  it('loads 563 unique opportunities keyed by CRM GUID', () => {
    expect(repo.opportunities).toHaveLength(563);
    expect(new Set(repo.opportunities.map((o) => o.guid)).size).toBe(563);
  });

  it('achieved GP for all won deals is AED 14,425,155', () => {
    expect(sum(repo.opportunities.filter((o) => o.group === 'WON'), (o) => o.actualGP)).toBe(14_425_155);
  });

  it('Q3 achieved GP matches the workbook (AED 6,869,748)', () => {
    expect(executive({ period: '2026-Q3' }).achieved.value).toBe(6_869_748);
  });

  it('Q3 target matches the BRD reference (AED 10,436,648)', () => {
    expect(executive({ period: '2026-Q3' }).target.value).toBe(10_436_648);
  });

  it('open forecast: dated + undated equals the BRD reference (AED 24,333,837)', () => {
    const open = repo.opportunities.filter((o) => o.group === 'OPEN');
    expect(sum(open, (o) => o.estimatedGP)).toBe(24_333_837);
  });

  it('FY open forecast + undated reconciles', () => {
    const p = pipeline({ period: '2026-FY' });
    expect(p.openGP.value + p.undated.value).toBeLessThanOrEqual(24_333_837);
    expect(p.undated.count).toBe(4);
  });

  it('drill-through total equals the KPI it explains', () => {
    const e = executive({ period: '2026-Q3' });
    const d = drill({ filters: { period: '2026-Q3' }, measure: 'ACHIEVED_GP' });
    expect(d.total).toBe(e.achieved.value);
    expect(d.rows).toHaveLength(e.achieved.count);
  });

  it('monthly achieved sums to the quarter (no derived monthly targets)', () => {
    const e = executive({ period: '2026-Q3' });
    const q3 = e.achievedByMonth.filter((m) => m.inPeriod);
    expect(q3).toHaveLength(3);
    expect(sum(q3, (m) => m.value)).toBe(e.achieved.value);
  });

  it('client manager table sums to the same achieved GP', () => {
    const cm = clientManagers({ period: '2026-Q3' });
    expect(sum(cm.rows, (r) => r.achieved)).toBe(6_869_748);
  });

  it('exceptions are counted and unmapped managers are flagged', () => {
    const x = exceptions({ period: '2026-Q3' });
    expect(x.total).toBe(64);
    expect(x.byRule.find((r) => r.rule.id === 'E04')!.count).toBeGreaterThan(0);
  });

  it('rejects an unknown period', () => {
    expect(() => executive({ period: '2025-Q9' })).toThrow();
  });
});
