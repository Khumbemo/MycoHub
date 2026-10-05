import { describe, expect, it } from 'vitest';
import { shannonIndex, speciesCounts } from './stats';
import type { FieldRecord } from '../types';

describe('shannonIndex', () => {
  it('is 0 for no records and for a single species', () => {
    expect(shannonIndex([])).toBe(0);
    expect(shannonIndex([10])).toBeCloseTo(0, 12);
  });

  it('equals ln S when all S species are equally abundant', () => {
    expect(shannonIndex([1, 1])).toBeCloseTo(Math.log(2), 12);
    expect(shannonIndex([5, 5, 5, 5])).toBeCloseTo(Math.log(4), 12);
  });

  it('matches a hand-worked uneven community', () => {
    // H' = -(0.5 ln 0.5 + 0.3 ln 0.3 + 0.2 ln 0.2) = 1.029653...
    expect(shannonIndex([50, 30, 20])).toBeCloseTo(1.029653, 6);
  });

  it('ignores zero counts', () => {
    expect(shannonIndex([3, 0, 3])).toBeCloseTo(Math.log(2), 12);
  });
});

describe('speciesCounts', () => {
  const rec = (scientificName: string) => ({ scientificName }) as FieldRecord;

  it('merges names that differ only in case and whitespace', () => {
    const counts = speciesCounts([rec('Amanita muscaria'), rec(' amanita MUSCARIA '), rec('Boletus edulis')]);
    expect(counts.get('Amanita muscaria')).toBe(2);
    expect(counts.get('Boletus edulis')).toBe(1);
    expect(counts.size).toBe(2);
  });

  it('skips blank names', () => {
    expect(speciesCounts([rec('   ')]).size).toBe(0);
  });
});

import { chao1, rarefy, rarefactionCurve, groupBySite } from './stats';

describe('chao1', () => {
  it('equals observed richness when there are no singletons', () => {
    expect(chao1([2, 3, 5])).toBe(3);
  });

  it('applies the bias-corrected formula', () => {
    // S_obs = 4, f1 = 2, f2 = 1 → 4 + 2·1 / (2·2) = 4.5
    expect(chao1([1, 1, 2, 7])).toBeCloseTo(4.5, 12);
    // f2 = 0 still defined: S_obs = 3, f1 = 3 → 3 + 3·2 / 2 = 6
    expect(chao1([1, 1, 1])).toBeCloseTo(6, 12);
  });

  it('ignores zero counts', () => {
    expect(chao1([0, 2, 3])).toBe(2);
  });
});

describe('rarefy', () => {
  it('gives 1 species for a subsample of 1 and S for the full sample', () => {
    expect(rarefy([5, 3, 2], 1)).toBeCloseTo(1, 12);
    expect(rarefy([5, 3, 2], 10)).toBe(3);
  });

  it('matches a hand-worked value', () => {
    // N = 4 with counts [2, 1, 1], n = 2:
    // P(species with 2 absent) = C(2,2)/C(4,2) = 1/6; singletons absent: C(3,2)/C(4,2) = 3/6
    // E = (1 − 1/6) + 2·(1 − 1/2) = 1.8333…
    expect(rarefy([2, 1, 1], 2)).toBeCloseTo(11 / 6, 12);
  });

  it('is non-decreasing along the curve', () => {
    const curve = rarefactionCurve([10, 5, 3, 1, 1, 1], 50);
    for (let i = 1; i < curve.length; i++) expect(curve[i].s).toBeGreaterThanOrEqual(curve[i - 1].s - 1e-12);
    expect(curve[curve.length - 1]).toEqual({ n: 21, s: 6 });
  });
});

describe('groupBySite', () => {
  it('groups by locality ignoring case and whitespace', () => {
    const g = groupBySite([{ locality: 'Plot A' }, { locality: ' plot a ' }, { locality: 'Plot B' }, { locality: '' }]);
    expect(g.get('plot a')?.length).toBe(2);
    expect(g.get('plot b')?.length).toBe(1);
    expect(g.get('')?.length).toBe(1);
  });
});
