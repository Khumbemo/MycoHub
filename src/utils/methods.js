/*
 * Sampling designs for macrofungal surveys.
 *
 * The methods follow the standard field designs for sporocarp (fruit-body)
 * inventories described in Mueller, Bills & Foster (eds.) 2004, Biodiversity
 * of Fungi: Inventory and Monitoring Methods (Elsevier), in particular Lodge et
 * al., "Terrestrial and lignicolous macrofungi". Defaults are starting points,
 * not prescriptions: every parameter is editable and is stored with the survey.
 *
 * Output maps onto Darwin Core Event terms (samplingProtocol, sampleSizeValue,
 * sampleSizeUnit, samplingEffort) so a survey can be published as a GBIF
 * sampling-event dataset.
 */

const num = (key, label, unit, def, min, max, step = 1, hint) => ({
  key,
  label,
  unit,
  type: 'number',
  default: def,
  min,
  max,
  step,
  hint,
});
const choice = (key, label, def, options, hint) => ({ key, label, type: 'select', default: def, options, hint });

const PLACEMENT = [
  ['random', 'Random'],
  ['systematic', 'Systematic grid'],
  ['subjective', 'Chosen in the field'],
];

/** @typedef {{ id: string, label: string, x?: number, y?: number, done?: boolean, meta?: object }} SamplingUnit */

export const METHODS = [
  {
    id: 'opportunistic',
    name: 'Opportunistic search',
    summary: 'Walk the site and record everything you find, without a fixed area or time.',
    bestFor: 'Species lists and finding rare species. Not for comparing sites: effort is not controlled.',
    unitNoun: null,
    counts: true,
    params: [
      num('observers', 'Observers', 'people', 1, 1, 50),
      num('areaHa', 'Area searched (optional)', 'ha', 0, 0, 100000, 0.1, 'Leave 0 if unknown.'),
    ],
  },
  {
    id: 'timed',
    name: 'Timed search',
    summary: 'Search for a fixed time; effort is minutes × observers (person-hours).',
    bestFor: 'Comparing sites or visits by effort, e.g. species per person-hour.',
    unitNoun: null,
    counts: true,
    params: [num('durationMin', 'Duration', 'min', 60, 5, 1440, 5), num('observers', 'Observers', 'people', 2, 1, 50)],
  },
  {
    id: 'quadrat',
    name: 'Quadrats',
    summary: 'Square plots of fixed size placed in a study plot; search each one completely.',
    bestFor:
      'Density (fruit bodies per m²) and frequency (% of quadrats with a species). The standard design for comparing sites.',
    unitNoun: 'quadrat',
    counts: true,
    params: [
      num('sideM', 'Quadrat side', 'm', 5, 0.25, 100, 0.25),
      num('count', 'Number of quadrats', '', 10, 1, 200),
      choice('placement', 'Placement', 'random', PLACEMENT),
      num('plotWidthM', 'Study plot width', 'm', 50, 1, 5000),
      num('plotLengthM', 'Study plot length', 'm', 50, 1, 5000),
      num('observers', 'Observers', 'people', 1, 1, 50),
    ],
  },
  {
    id: 'transect',
    name: 'Belt transect',
    summary: 'A strip of fixed length and width, searched in numbered segments.',
    bestFor: 'Change along a gradient, such as forest edge to interior, or along a slope or stream.',
    unitNoun: 'segment',
    counts: true,
    params: [
      num('lengthM', 'Transect length', 'm', 100, 1, 10000),
      num('widthM', 'Belt width', 'm', 2, 0.1, 100, 0.1),
      num('segmentM', 'Segment length', 'm', 10, 1, 10000),
      num('count', 'Number of transects', '', 1, 1, 50),
      num('observers', 'Observers', 'people', 1, 1, 50),
    ],
  },
  {
    id: 'circular',
    name: 'Circular plots',
    summary: 'Fixed-radius plots around a marked centre, usually permanent and revisited.',
    bestFor: 'Long-term monitoring across seasons and years at the same spots.',
    unitNoun: 'plot',
    counts: true,
    params: [
      num('radiusM', 'Plot radius', 'm', 5.64, 0.5, 100, 0.01, '5.64 m gives 100 m²; 17.84 m gives 1000 m².'),
      num('count', 'Number of plots', '', 3, 1, 100),
      num('observers', 'Observers', 'people', 1, 1, 50),
    ],
  },
  {
    id: 'substrate',
    name: 'Woody debris survey',
    summary: 'Examine logs and branches above a minimum diameter; each piece is a sampling unit.',
    bestFor: 'Wood-decay (lignicolous) fungi and how they change with decay stage.',
    unitNoun: 'log',
    counts: true,
    params: [
      num('minDiameterCm', 'Minimum diameter', 'cm', 10, 1, 200),
      num('searchAreaM2', 'Search area (optional)', 'm²', 0, 0, 1000000, 1, 'Leave 0 if unknown.'),
      num('observers', 'Observers', 'people', 1, 1, 50),
    ],
  },
  {
    id: 'soilcore',
    name: 'Soil cores (DNA)',
    summary: 'Collect soil cores for DNA metabarcoding; records the samples, not fruit bodies.',
    bestFor: 'Below-ground communities, including fungi that rarely fruit.',
    unitNoun: 'core',
    counts: false,
    params: [
      num('coreDiameterCm', 'Core diameter', 'cm', 5, 0.5, 50, 0.5),
      num('depthCm', 'Depth', 'cm', 10, 1, 200),
      num('count', 'Number of cores', '', 10, 1, 500),
      choice('placement', 'Placement', 'systematic', PLACEMENT),
      num('plotWidthM', 'Study plot width', 'm', 20, 1, 5000),
      num('plotLengthM', 'Study plot length', 'm', 20, 1, 5000),
      num('observers', 'Observers', 'people', 1, 1, 50),
    ],
  },
];

export const methodById = (id) => METHODS.find((m) => m.id === id);

export const defaultParams = (methodId) =>
  Object.fromEntries((methodById(methodId)?.params ?? []).map((p) => [p.key, p.default]));

/** Coerce stored params to the method's types, filling in defaults. */
export const normaliseParams = (methodId, params = {}) => {
  const out = {};
  for (const p of methodById(methodId)?.params ?? []) {
    const v = params[p.key];
    if (p.type === 'number') {
      const n = Number(v);
      out[p.key] = v === '' || v === null || v === undefined || !Number.isFinite(n) ? p.default : n;
    } else {
      out[p.key] = p.options.some(([o]) => o === v) ? v : p.default;
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// Sampling units
// ---------------------------------------------------------------------------

/** Deterministic PRNG (mulberry32), seeded from a string, so a survey's layout is reproducible. */
export const seededRandom = (seedText) => {
  let seed = 0;
  for (const ch of String(seedText)) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) | 0;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Lower-left corners of `count` squares of side `side` inside a W × L plot.
 * Random: uniform positions, rejecting overlaps. Systematic: an even grid.
 * Returns null when they cannot fit.
 */
export const placeSquares = ({ count, side, width, length, placement, seed }) => {
  if (side > width || side > length) return null;
  if (placement === 'systematic') {
    const cols = Math.max(1, Math.round(Math.sqrt((count * width) / length)));
    const rows = Math.ceil(count / cols);
    const cellW = width / cols;
    const cellL = length / rows;
    if (side > cellW || side > cellL) return null;
    return Array.from({ length: count }, (_, i) => ({
      x: round1((i % cols) * cellW + (cellW - side) / 2),
      y: round1(Math.floor(i / cols) * cellL + (cellL - side) / 2),
    }));
  }
  // Random: give up if the squares would cover more than half the plot.
  if (count * side * side > 0.5 * width * length) return null;
  const rand = seededRandom(seed);
  const placed = [];
  let attempts = 0;
  while (placed.length < count && attempts < count * 500) {
    attempts++;
    const p = { x: round1(rand() * (width - side)), y: round1(rand() * (length - side)) };
    if (placed.every((q) => Math.abs(q.x - p.x) >= side || Math.abs(q.y - p.y) >= side)) placed.push(p);
  }
  return placed.length === count ? placed : null;
};

/** Points for soil cores: the same layouts, with zero-size squares. */
const placePoints = ({ count, width, length, placement, seed }) => {
  if (placement === 'systematic') return placeSquares({ count, side: 0, width, length, placement, seed });
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => ({ x: round1(rand() * width), y: round1(rand() * length) }));
};

/**
 * Initial sampling units for a new survey. Returns { units } or { error }.
 * Timed and opportunistic searches have no units; woody debris units (logs)
 * are added in the field.
 */
export const generateUnits = (methodId, rawParams, seed = 'survey') => {
  const p = normaliseParams(methodId, rawParams);
  switch (methodId) {
    case 'quadrat': {
      const labels = Array.from({ length: p.count }, (_, i) => `Q${i + 1}`);
      if (p.placement === 'subjective') return { units: labels.map((label) => ({ id: label, label, done: false })) };
      const pos = placeSquares({
        count: p.count,
        side: p.sideM,
        width: p.plotWidthM,
        length: p.plotLengthM,
        placement: p.placement,
        seed,
      });
      if (!pos)
        return {
          error: `${p.count} quadrats of ${p.sideM} × ${p.sideM} m don't fit in a ${p.plotWidthM} × ${p.plotLengthM} m plot. Use fewer or smaller quadrats, or a larger plot.`,
        };
      return { units: labels.map((label, i) => ({ id: label, label, ...pos[i], done: false })) };
    }
    case 'soilcore': {
      const labels = Array.from({ length: p.count }, (_, i) => `C${i + 1}`);
      if (p.placement === 'subjective') return { units: labels.map((label) => ({ id: label, label, done: false })) };
      const pos = placePoints({
        count: p.count,
        width: p.plotWidthM,
        length: p.plotLengthM,
        placement: p.placement,
        seed,
      });
      return { units: labels.map((label, i) => ({ id: label, label, ...pos[i], done: false })) };
    }
    case 'transect': {
      const segments = Math.ceil(p.lengthM / p.segmentM);
      if (segments > 500) return { error: 'More than 500 segments per transect: use longer segments.' };
      const units = [];
      for (let t = 1; t <= p.count; t++) {
        for (let s = 1; s <= segments; s++) {
          const from = (s - 1) * p.segmentM;
          const to = Math.min(s * p.segmentM, p.lengthM);
          const label = p.count > 1 ? `T${t}·S${s}` : `S${s}`;
          units.push({ id: `T${t}S${s}`, label, meta: { transect: t, fromM: from, toM: to }, done: false });
        }
      }
      return { units };
    }
    case 'circular':
      return {
        units: Array.from({ length: p.count }, (_, i) => ({ id: `P${i + 1}`, label: `P${i + 1}`, done: false })),
      };
    default:
      return { units: [] };
  }
};

/** Area of one sampling unit in m², or null if the unit has no fixed area. */
export const unitAreaM2 = (methodId, rawParams, unit) => {
  const p = normaliseParams(methodId, rawParams);
  switch (methodId) {
    case 'quadrat':
      return p.sideM * p.sideM;
    case 'circular':
      return Math.PI * p.radiusM * p.radiusM;
    case 'transect': {
      const len = unit?.meta ? unit.meta.toM - unit.meta.fromM : p.segmentM;
      return len * p.widthM;
    }
    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// Sample size, effort and protocol (Darwin Core Event terms)
// ---------------------------------------------------------------------------

const fmt = (n, digits = 2) => {
  if (!Number.isFinite(n)) return '';
  const r = Number(n.toFixed(digits));
  return String(r);
};

const unitsDone = (survey) => (survey.units ?? []).filter((u) => u.done);

/** Minutes actually spent: the timer if used, otherwise start → end. */
export const elapsedMinutes = (survey, now = Date.now()) => {
  const t = survey.timer;
  if (t && (t.elapsedMs > 0 || t.runningSince)) {
    const ms = t.elapsedMs + (t.runningSince ? now - t.runningSince : 0);
    return ms / 60000;
  }
  if (!survey.startedAt) return null;
  const end = survey.endedAt ? Date.parse(survey.endedAt) : null;
  if (!end) return null;
  return Math.max(0, (end - Date.parse(survey.startedAt)) / 60000);
};

/** Person-hours of searching, or null when time wasn't recorded. */
export const personHours = (survey, now) => {
  const p = normaliseParams(survey.method, survey.params);
  const minutes =
    survey.method === 'timed' ? (elapsedMinutes(survey, now) ?? p.durationMin) : elapsedMinutes(survey, now);
  if (minutes === null) return null;
  return (minutes / 60) * p.observers;
};

/**
 * Darwin Core sampleSizeValue / sampleSizeUnit for the survey as carried out
 * (only completed units count, if the method has units).
 */
export const sampleSize = (survey) => {
  const p = normaliseParams(survey.method, survey.params);
  const done = unitsDone(survey);
  switch (survey.method) {
    case 'quadrat':
    case 'circular':
    case 'transect': {
      const area = done.reduce((a, u) => a + unitAreaM2(survey.method, p, u), 0);
      return area > 0 ? { value: Number(area.toFixed(2)), unit: 'square metre' } : null;
    }
    case 'timed': {
      const minutes = elapsedMinutes(survey) ?? p.durationMin;
      return { value: Number(minutes.toFixed(1)), unit: 'minute' };
    }
    case 'opportunistic':
      return p.areaHa > 0 ? { value: p.areaHa, unit: 'hectare' } : null;
    case 'substrate':
      return p.searchAreaM2 > 0 ? { value: p.searchAreaM2, unit: 'square metre' } : null;
    case 'soilcore': {
      const r = p.coreDiameterCm / 2;
      const vol = done.length * Math.PI * r * r * p.depthCm;
      return vol > 0 ? { value: Number(vol.toFixed(1)), unit: 'cubic centimetre' } : null;
    }
    default:
      return null;
  }
};

/** Darwin Core samplingEffort, e.g. "2 observers; 60 min; 2 person-hours". */
export const samplingEffort = (survey) => {
  const p = normaliseParams(survey.method, survey.params);
  const parts = [`${p.observers} observer${p.observers === 1 ? '' : 's'}`];
  const minutes = survey.method === 'timed' ? (elapsedMinutes(survey) ?? p.durationMin) : elapsedMinutes(survey);
  if (minutes !== null) parts.push(`${fmt(minutes, 0)} min`);
  const ph = personHours(survey);
  if (ph !== null) parts.push(`${fmt(ph, 2)} person-hours`);
  const m = methodById(survey.method);
  if (m?.unitNoun) {
    const done = unitsDone(survey).length;
    const total = (survey.units ?? []).length;
    const noun = `${m.unitNoun}${total === 1 ? '' : 's'}`;
    parts.push(survey.method === 'substrate' ? `${done} ${noun} examined` : `${done} of ${total} ${noun} completed`);
  }
  return parts.join('; ');
};

/** Darwin Core samplingProtocol: a one-line description of the design. */
export const samplingProtocol = (survey) => {
  const p = normaliseParams(survey.method, survey.params);
  const place = (k) => ({ random: 'random', systematic: 'systematic grid', subjective: 'chosen in the field' })[k];
  switch (survey.method) {
    case 'opportunistic':
      return 'Opportunistic search for macrofungal fruit bodies';
    case 'timed':
      return `Timed search for macrofungal fruit bodies, ${p.durationMin} min × ${p.observers} observers`;
    case 'quadrat':
      return `Quadrats, ${fmt(p.sideM)} × ${fmt(p.sideM)} m (n = ${p.count}), ${place(p.placement)} placement in a ${fmt(p.plotWidthM)} × ${fmt(p.plotLengthM)} m plot; fruit bodies counted per quadrat`;
    case 'transect':
      return `Belt transect, ${fmt(p.lengthM)} m × ${fmt(p.widthM)} m (n = ${p.count}), ${fmt(p.segmentM)} m segments; fruit bodies counted per segment`;
    case 'circular':
      return `Circular plots, radius ${fmt(p.radiusM)} m (${fmt(Math.PI * p.radiusM * p.radiusM, 1)} m²; n = ${p.count}); fruit bodies counted per plot`;
    case 'substrate':
      return `Woody debris survey: all pieces ≥ ${fmt(p.minDiameterCm)} cm diameter examined; decay class 1–5`;
    case 'soilcore':
      return `Soil cores, ${fmt(p.coreDiameterCm)} cm diameter × ${fmt(p.depthCm)} cm depth (n = ${p.count}), ${place(p.placement)} placement in a ${fmt(p.plotWidthM)} × ${fmt(p.plotLengthM)} m plot; for DNA metabarcoding`;
    default:
      return '';
  }
};

/** Snapshot stored on each linked record, so synced copies keep their method. */
export const surveySnapshot = (survey) => {
  const size = sampleSize(survey);
  return {
    id: survey.id,
    name: survey.name,
    method: survey.method,
    protocol: samplingProtocol(survey),
    sampleSizeValue: size?.value ?? null,
    sampleSizeUnit: size?.unit ?? null,
    effort: samplingEffort(survey),
    startedAt: survey.startedAt ?? null,
    endedAt: survey.endedAt ?? null,
  };
};

// ---------------------------------------------------------------------------
// Methods paragraph for a report or paper
// ---------------------------------------------------------------------------

const DATE_FMT = { day: 'numeric', month: 'long', year: 'numeric' };
const longDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', DATE_FMT) : '');

/**
 * A draft Methods paragraph. `records` are the occurrences linked to the survey.
 * Plain prose; the author should check it and add study-specific detail.
 */
export const methodsParagraph = (survey, records = []) => {
  const p = normaliseParams(survey.method, survey.params);
  const m = methodById(survey.method);
  const site = survey.site?.locality ? ` at ${survey.site.locality}` : '';
  const coords =
    survey.site?.latitude !== null && survey.site?.latitude !== undefined && survey.site?.longitude !== null
      ? ` (${fmt(survey.site.latitude, 5)}, ${fmt(survey.site.longitude, 5)})`
      : '';
  const when = survey.startedAt ? ` on ${longDate(survey.startedAt)}` : '';
  const obs = `${p.observers} observer${p.observers === 1 ? '' : 's'}`;
  const species = new Set(records.map((r) => r.scientificName.trim().toLowerCase()).filter(Boolean)).size;
  const fruitBodies = records.reduce(
    (a, r) =>
      a + (r.organismQuantityType === 'sporocarps' && Number.isFinite(r.organismQuantity) ? r.organismQuantity : 0),
    0,
  );
  const done = unitsDone(survey).length;
  const ph = personHours(survey);

  const s = [];
  switch (survey.method) {
    case 'opportunistic':
      s.push(
        `Macrofungi were surveyed${site}${coords}${when} by opportunistic search: ${obs} walked the site and recorded all fruit bodies encountered${p.areaHa > 0 ? ` within an area of about ${fmt(p.areaHa)} ha` : ''}.`,
      );
      break;
    case 'timed':
      s.push(
        `Macrofungi were surveyed${site}${coords}${when} by timed search: ${obs} searched for ${fmt(elapsedMinutes(survey) ?? p.durationMin, 0)} min, recording all fruit bodies encountered.`,
      );
      break;
    case 'quadrat':
      s.push(
        `Macrofungi were surveyed${site}${coords}${when} in ${p.count} quadrats of ${fmt(p.sideM)} × ${fmt(p.sideM)} m (${fmt(p.sideM * p.sideM)} m² each), placed ${
          p.placement === 'random'
            ? 'at random, without overlap,'
            : p.placement === 'systematic'
              ? 'on a systematic grid'
              : 'by the observers'
        } within a ${fmt(p.plotWidthM)} × ${fmt(p.plotLengthM)} m study plot. Each quadrat was searched completely by ${obs}, and fruit bodies of each species were counted.`,
      );
      break;
    case 'transect':
      s.push(
        `Macrofungi were surveyed${site}${coords}${when} along ${p.count === 1 ? 'a belt transect' : `${p.count} belt transects`} of ${fmt(p.lengthM)} m × ${fmt(p.widthM)} m, divided into ${fmt(p.segmentM)} m segments. ${obs.charAt(0).toUpperCase() + obs.slice(1)} searched each segment and counted fruit bodies of each species.`,
      );
      break;
    case 'circular':
      s.push(
        `Macrofungi were surveyed${site}${coords}${when} in ${p.count} circular plot${p.count === 1 ? '' : 's'} of ${fmt(p.radiusM)} m radius (${fmt(Math.PI * p.radiusM * p.radiusM, 1)} m² each). ${obs.charAt(0).toUpperCase() + obs.slice(1)} searched each plot and counted fruit bodies of each species.`,
      );
      break;
    case 'substrate':
      s.push(
        `Wood-inhabiting fungi were surveyed${site}${coords}${when}: all woody debris ≥ ${fmt(p.minDiameterCm)} cm in diameter${p.searchAreaM2 > 0 ? ` within ${fmt(p.searchAreaM2, 0)} m²` : ''} was examined by ${obs}, and each piece was assigned a decay class (1, recently fallen, to 5, almost fully decomposed).`,
      );
      break;
    case 'soilcore':
      s.push(
        `Soil was sampled${site}${coords}${when} for DNA metabarcoding: ${p.count} cores of ${fmt(p.coreDiameterCm)} cm diameter were taken to ${fmt(p.depthCm)} cm depth, ${
          p.placement === 'random'
            ? 'at random positions'
            : p.placement === 'systematic'
              ? 'on a systematic grid'
              : 'at positions chosen in the field'
        } within a ${fmt(p.plotWidthM)} × ${fmt(p.plotLengthM)} m plot.`,
      );
      break;
    default:
      break;
  }

  if (m?.unitNoun && (survey.units ?? []).length > 0 && survey.method !== 'substrate') {
    s.push(`${done} of ${survey.units.length} ${m.unitNoun}s were completed.`);
  }
  if (survey.method === 'substrate') s.push(`${done} piece${done === 1 ? ' was' : 's were'} examined.`);
  if (ph !== null && survey.method !== 'soilcore') s.push(`Total effort was ${fmt(ph, 1)} person-hours.`);
  if (m?.counts && records.length > 0) {
    s.push(
      `${records.length} record${records.length === 1 ? '' : 's'} of ${species} species were made${fruitBodies > 0 ? ` (${fruitBodies} fruit bodies)` : ''}.`,
    );
  }
  if (m?.counts) {
    s.push(
      'Because fruiting is irregular, absence of fruit bodies on a single visit does not indicate absence of the fungus; repeated visits across seasons and years are needed for a fuller inventory (Lodge et al. 2004).',
    );
  }
  s.push('Data were recorded with MycoHub using Darwin Core terms.');
  return s.join(' ');
};
