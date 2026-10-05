// Spore measurement statistics in the form mycologists publish them:
//   L × W = 8.0–10.5 × 6.0–7.5 µm, mean 9.2 × 6.6 µm, Q = 1.27–1.55, Qm = 1.40, n = 20
// where Q is each spore's length/width ratio and Qm the mean Q.

export interface Spore {
  length: number;
  width: number;
}

export interface Range {
  min: number;
  max: number;
  mean: number;
  sd: number;
}

export interface SporeStats {
  n: number;
  length: Range;
  width: Range;
  q: Range;
}

/** Parse "9.5 x 7, 10×7.5; 8.5 * 6" (also "by", newlines) into spores. */
export const parseSporeMeasurements = (raw: string): { spores: Spore[]; invalid: string[] } => {
  const spores: Spore[] = [];
  const invalid: string[] = [];
  for (const part of raw.split(/[,;\n]+/)) {
    const token = part.trim();
    if (!token) continue;
    const m = token.match(/^(\d+(?:\.\d+)?)\s*(?:x|×|\*|by)\s*(\d+(?:\.\d+)?)\s*(?:µm|um|μm)?$/i);
    const length = m ? Number(m[1]) : NaN;
    const width = m ? Number(m[2]) : NaN;
    if (!m || width <= 0 || length <= 0 || length > 500 || width > 500) invalid.push(token);
    else spores.push({ length, width });
  }
  return { spores, invalid };
};

const range = (values: number[]): Range => {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  // Sample standard deviation (n − 1); 0 for a single value.
  const sd = n > 1 ? Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / (n - 1)) : 0;
  return { min: Math.min(...values), max: Math.max(...values), mean, sd };
};

export const sporeStats = (spores: Spore[]): SporeStats | null => {
  if (spores.length === 0) return null;
  return {
    n: spores.length,
    length: range(spores.map((s) => s.length)),
    width: range(spores.map((s) => s.width)),
    q: range(spores.map((s) => s.length / s.width)),
  };
};

const f1 = (v: number) => v.toFixed(1);
const f2 = (v: number) => v.toFixed(2);

/** Standard one-line summary for a description or label. */
export const formatSporeStats = (s: SporeStats): string =>
  `${f1(s.length.min)}–${f1(s.length.max)} × ${f1(s.width.min)}–${f1(s.width.max)} µm, ` +
  `mean ${f1(s.length.mean)} × ${f1(s.width.mean)} µm, ` +
  `Q = ${f2(s.q.min)}–${f2(s.q.max)}, Qm = ${f2(s.q.mean)}, n = ${s.n}`;
