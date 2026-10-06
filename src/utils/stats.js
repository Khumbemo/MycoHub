/** Shannon diversity H' = -Σ pᵢ ln pᵢ over species abundances. */
export const shannonIndex = (counts) => {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  return -counts.reduce((h, n) => (n === 0 ? h : h + (n / total) * Math.log(n / total)), 0);
};

/** Count records per scientific name (case-insensitive, trimmed). */
export const speciesCounts = (records) => {
  const counts = new Map();
  for (const r of records) {
    const name = r.scientificName.trim();
    if (!name) continue;
    const key = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

/** Number of species seen exactly once (f1) and exactly twice (f2). */
const singletonsDoubletons = (counts) => ({
  f1: counts.filter((n) => n === 1).length,
  f2: counts.filter((n) => n === 2).length,
});

/**
 * Bias-corrected Chao1 estimate of total species richness:
 *   S_chao1 = S_obs + f1(f1 − 1) / (2(f2 + 1))
 * (Chao 1987; bias-corrected form as in EstimateS). Defined even when f2 = 0.
 */
export const chao1 = (counts) => {
  const present = counts.filter((n) => n > 0);
  const { f1, f2 } = singletonsDoubletons(present);
  return present.length + (f1 * (f1 - 1)) / (2 * (f2 + 1));
};

/**
 * Expected number of species in a random subsample of n records (Hurlbert 1971):
 *   E[S_n] = Σ_i [1 − C(N − N_i, n) / C(N, n)]
 * computed as a running product to avoid huge binomials.
 */
export const rarefy = (counts, n) => {
  const present = counts.filter((c) => c > 0);
  const N = present.reduce((a, b) => a + b, 0);
  if (n <= 0 || N === 0) return 0;
  if (n >= N) return present.length;
  let expected = 0;
  for (const Ni of present) {
    if (N - Ni < n) {
      expected += 1; // every subsample of size n must include this species
      continue;
    }
    let pAbsent = 1;
    for (let k = 0; k < n; k++) pAbsent *= (N - Ni - k) / (N - k);
    expected += 1 - pAbsent;
  }
  return expected;
};

/** Rarefaction curve points from 1 to N records (at most `maxPoints` points). */
export const rarefactionCurve = (counts, maxPoints = 30) => {
  const N = counts.reduce((a, b) => a + b, 0);
  if (N === 0) return [];
  const step = Math.max(1, Math.ceil(N / maxPoints));
  const points = [];
  for (let n = 1; n <= N; n += step) points.push({ n, s: rarefy(counts, n) });
  if (points[points.length - 1].n !== N) points.push({ n: N, s: rarefy(counts, N) });
  return points;
};

/** Group records by site (trimmed, case-insensitive locality). Blank localities are grouped as "". */
export const groupBySite = (records) => {
  const groups = new Map();
  for (const r of records) {
    const key = r.locality.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return groups;
};
