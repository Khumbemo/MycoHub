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
