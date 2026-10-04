import type { FieldRecord } from '../types';

/** Shannon diversity H' = -Σ pᵢ ln pᵢ over species abundances. */
export const shannonIndex = (counts: number[]): number => {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return -counts.reduce((h, n) => (n === 0 ? h : h + (n / total) * Math.log(n / total)), 0);
};

/** Count records per scientific name (case-insensitive, trimmed). */
export const speciesCounts = (records: FieldRecord[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const r of records) {
    const name = r.scientificName.trim();
    if (!name) continue;
    const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};
