import { describe, expect, it } from 'vitest';
import {
  METHODS,
  defaultParams,
  generateUnits,
  methodsParagraph,
  normaliseParams,
  personHours,
  placeSquares,
  sampleSize,
  samplingEffort,
  samplingProtocol,
  unitAreaM2,
} from './methods';
import { accumulationCurve, frequencies } from './stats';

const overlaps = (a, b, side) => Math.abs(a.x - b.x) < side && Math.abs(a.y - b.y) < side;

const survey = (method, params = {}, extra = {}) => {
  const p = { ...defaultParams(method), ...params };
  const { units } = generateUnits(method, p, 'seed');
  return { id: 's1', name: 'Test', method, params: p, units, startedAt: null, endedAt: null, timer: null, ...extra };
};

describe('method definitions', () => {
  it('has seven methods, each with default parameters', () => {
    expect(METHODS.map((m) => m.id)).toEqual([
      'opportunistic',
      'timed',
      'quadrat',
      'transect',
      'circular',
      'substrate',
      'soilcore',
    ]);
    for (const m of METHODS) expect(defaultParams(m.id).observers).toBeGreaterThan(0);
  });

  it('fills in defaults and coerces numbers', () => {
    expect(normaliseParams('quadrat', { sideM: '2', count: '' })).toMatchObject({ sideM: 2, count: 10 });
    expect(normaliseParams('quadrat', { placement: 'nonsense' }).placement).toBe('random');
  });
});

describe('quadrat placement', () => {
  it('places random quadrats inside the plot without overlap, reproducibly', () => {
    const a = placeSquares({ count: 12, side: 5, width: 50, length: 40, placement: 'random', seed: 'x' });
    const b = placeSquares({ count: 12, side: 5, width: 50, length: 40, placement: 'random', seed: 'x' });
    expect(a).toEqual(b);
    expect(a).toHaveLength(12);
    for (const q of a) {
      expect(q.x).toBeGreaterThanOrEqual(0);
      expect(q.y).toBeGreaterThanOrEqual(0);
      expect(q.x + 5).toBeLessThanOrEqual(50.05);
      expect(q.y + 5).toBeLessThanOrEqual(40.05);
    }
    for (let i = 0; i < a.length; i++)
      for (let j = i + 1; j < a.length; j++) expect(overlaps(a[i], a[j], 5)).toBe(false);
  });

  it('lays a systematic grid evenly', () => {
    const g = placeSquares({ count: 4, side: 2, width: 20, length: 20, placement: 'systematic', seed: '' });
    expect(g).toEqual([
      { x: 4, y: 4 },
      { x: 14, y: 4 },
      { x: 4, y: 14 },
      { x: 14, y: 14 },
    ]);
  });

  it('refuses layouts that cannot fit', () => {
    expect(generateUnits('quadrat', { sideM: 10, count: 30, plotWidthM: 50, plotLengthM: 50 }).error).toMatch(
      /don't fit/,
    );
    expect(generateUnits('quadrat', { sideM: 60, count: 1, plotWidthM: 50, plotLengthM: 50 }).error).toBeTruthy();
  });
});

describe('sampling units', () => {
  it('splits transects into segments, with a short last segment', () => {
    const { units } = generateUnits('transect', { lengthM: 25, segmentM: 10, count: 2 });
    expect(units.map((u) => u.label)).toEqual(['T1·S1', 'T1·S2', 'T1·S3', 'T2·S1', 'T2·S2', 'T2·S3']);
    expect(unitAreaM2('transect', { widthM: 2 }, units[2])).toBe(10); // 20–25 m × 2 m
  });

  it('gives searches no units and plots their own', () => {
    expect(generateUnits('timed', {}).units).toEqual([]);
    expect(generateUnits('circular', { count: 3 }).units.map((u) => u.id)).toEqual(['P1', 'P2', 'P3']);
    expect(generateUnits('soilcore', { count: 4 }).units).toHaveLength(4);
  });

  it('computes unit areas', () => {
    expect(unitAreaM2('quadrat', { sideM: 5 })).toBe(25);
    expect(unitAreaM2('circular', { radiusM: 5.64 })).toBeCloseTo(99.93, 1);
  });
});

describe('Darwin Core event terms', () => {
  it('counts only completed quadrats in the sample size', () => {
    const s = survey('quadrat', { sideM: 2, count: 4, plotWidthM: 20, plotLengthM: 20 });
    expect(sampleSize(s)).toBeNull();
    s.units[0].done = true;
    s.units[1].done = true;
    expect(sampleSize(s)).toEqual({ value: 8, unit: 'square metre' });
    expect(samplingProtocol(s)).toBe(
      'Quadrats, 2 × 2 m (n = 4), random placement in a 20 × 20 m plot; fruit bodies counted per quadrat',
    );
  });

  it('measures timed searches from the timer, in person-hours', () => {
    const s = survey(
      'timed',
      { durationMin: 60, observers: 3 },
      { timer: { runningSince: null, elapsedMs: 45 * 60000 } },
    );
    expect(sampleSize(s)).toEqual({ value: 45, unit: 'minute' });
    expect(personHours(s)).toBeCloseTo(2.25);
    expect(samplingEffort(s)).toBe('3 observers; 45 min; 2.25 person-hours');
  });

  it('falls back to the planned duration when no timer was used', () => {
    const s = survey('timed', { durationMin: 30, observers: 2 });
    expect(personHours(s)).toBe(1);
  });

  it('uses start and end times for other methods', () => {
    const s = survey(
      'circular',
      { observers: 2, count: 2 },
      {
        startedAt: '2026-10-01T10:00:00Z',
        endedAt: '2026-10-01T11:30:00Z',
      },
    );
    s.units[0].done = true;
    expect(personHours(s)).toBe(3);
    expect(samplingEffort(s)).toBe('2 observers; 90 min; 3 person-hours; 1 of 2 plots completed');
  });

  it('reports soil volume for cores', () => {
    const s = survey('soilcore', { coreDiameterCm: 2, depthCm: 10, count: 2 });
    s.units.forEach((u) => (u.done = true));
    expect(sampleSize(s)).toEqual({ value: 62.8, unit: 'cubic centimetre' });
  });
});

describe('methods paragraph', () => {
  it('describes the design, effort, results and the repeat-visit caveat', () => {
    const s = survey(
      'quadrat',
      { sideM: 5, count: 4, plotWidthM: 40, plotLengthM: 40, placement: 'systematic', observers: 2 },
      {
        site: { locality: 'Black Rock Forest', latitude: 41.4, longitude: -74.0 },
        startedAt: '2026-10-04T09:00:00Z',
        endedAt: '2026-10-04T11:00:00Z',
      },
    );
    s.units.forEach((u) => (u.done = true));
    const text = methodsParagraph(s, [
      { scientificName: 'Amanita muscaria', organismQuantityType: 'sporocarps', organismQuantity: 3 },
      { scientificName: 'Russula emetica', organismQuantityType: 'sporocarps', organismQuantity: 2 },
    ]);
    expect(text).toContain('at Black Rock Forest (41.4, -74)');
    expect(text).toContain(
      '4 quadrats of 5 × 5 m (25 m² each), placed on a systematic grid within a 40 × 40 m study plot',
    );
    expect(text).toContain('4 of 4 quadrats were completed.');
    expect(text).toContain('Total effort was 4 person-hours.');
    expect(text).toContain('2 records of 2 species were made (5 fruit bodies).');
    expect(text).toContain('Lodge et al. 2004');
  });
});

describe('unit-based statistics', () => {
  const units = [new Set(['A', 'B']), new Set(['A']), new Set(['C']), new Set()];

  it('computes frequency of occurrence', () => {
    expect(frequencies(units)).toEqual([
      { species: 'A', units: 2, frequency: 0.5 },
      { species: 'B', units: 1, frequency: 0.25 },
      { species: 'C', units: 1, frequency: 0.25 },
    ]);
  });

  it('builds an accumulation curve that ends at the observed richness', () => {
    let i = 0;
    const curve = accumulationCurve(units, 50, () => (i = (i * 9301 + 49297) % 233280) / 233280);
    expect(curve).toHaveLength(4);
    expect(curve[3].s).toBe(3);
    for (let k = 1; k < curve.length; k++) expect(curve[k].s).toBeGreaterThanOrEqual(curve[k - 1].s);
  });
});
