import { describe, expect, it } from 'vitest';
import { formatSporeStats, parseSporeMeasurements, sporeStats } from './microscopy';

describe('parseSporeMeasurements', () => {
  it('accepts common separators and units', () => {
    const { spores, invalid } = parseSporeMeasurements('9.5 x 7, 10×7.5; 8 * 6\n9 by 6.5 µm');
    expect(invalid).toEqual([]);
    expect(spores).toEqual([
      { length: 9.5, width: 7 }, { length: 10, width: 7.5 }, { length: 8, width: 6 }, { length: 9, width: 6.5 },
    ]);
  });

  it('reports tokens it cannot read', () => {
    expect(parseSporeMeasurements('9 x 7, nine by seven, 10').invalid).toEqual(['nine by seven', '10']);
    expect(parseSporeMeasurements('9 x 0').invalid).toEqual(['9 x 0']);
  });
});

describe('sporeStats', () => {
  it('computes ranges, means and Q per spore', () => {
    const s = sporeStats([{ length: 8, width: 6 }, { length: 10, width: 7 }, { length: 9, width: 6 }])!;
    expect(s.n).toBe(3);
    expect(s.length).toMatchObject({ min: 8, max: 10, mean: 9 });
    expect(s.length.sd).toBeCloseTo(1, 10);              // sample SD of 8, 9, 10
    expect(s.q.min).toBeCloseTo(8 / 6, 10);              // 1.333
    expect(s.q.max).toBeCloseTo(1.5, 10);                // 9/6
    expect(s.q.mean).toBeCloseTo((8 / 6 + 10 / 7 + 1.5) / 3, 10); // Qm is the mean of per-spore Q, not mean L / mean W
  });

  it('returns null with no measurements', () => {
    expect(sporeStats([])).toBeNull();
  });

  it('formats a publication-style summary', () => {
    const s = sporeStats([{ length: 8, width: 6 }, { length: 10, width: 7 }])!;
    expect(formatSporeStats(s)).toBe('8.0–10.0 × 6.0–7.0 µm, mean 9.0 × 6.5 µm, Q = 1.33–1.43, Qm = 1.38, n = 2');
  });
});
