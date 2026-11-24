import { recordConsensus } from './consensus';
import { normaliseParams, samplingEffort, samplingProtocol, sampleSize, unitAreaM2 } from './methods';
import { formatSporeStats, parseSporeMeasurements, sporeStats } from './microscopy';

const sporeSummary = (r) => {
  const s = sporeStats(parseSporeMeasurements(r.sporeMeasurements ?? '').spores);
  return s ? `spores ${formatSporeStats(s)}` : '';
};

// Column headers are Darwin Core term names so the file can be mapped straight into GBIF's IPT.
export const eventIdFor = (surveyId, unitId) => (surveyId ? (unitId ? `${surveyId}:${unitId}` : surveyId) : '');

export const DWC_COLUMNS = [
  ['occurrenceID', (r) => r.remoteId ?? r.id],
  ['basisOfRecord', (r) => (r.preserved ? 'PreservedSpecimen' : 'HumanObservation')],
  ['scientificName', (r) => r.scientificName],
  ['taxonID', (r) => (r.taxonomy ? `https://www.gbif.org/species/${r.taxonomy.taxonKey}` : '')],
  ['kingdom', () => 'Fungi'],
  ['phylum', (r) => r.taxonomy?.phylum ?? ''],
  ['class', (r) => r.taxonomy?.class ?? ''],
  ['order', (r) => r.taxonomy?.order ?? ''],
  ['family', (r) => r.taxonomy?.family ?? ''],
  ['genus', (r) => r.taxonomy?.genus ?? ''],
  ['identificationVerificationStatus', (r) => (r.status === 'FLAGGED' ? 'FLAGGED' : recordConsensus(r).status)],
  ['recordedBy', (r) => r.collectorName],
  ['recordNumber', (r) => r.collectionNumber],
  ['eventDate', (r) => r.timestamp.slice(0, 10)],
  ['locality', (r) => r.locality],
  ['decimalLatitude', (r) => r.latitude],
  ['decimalLongitude', (r) => r.longitude],
  ['geodeticDatum', (r) => (r.latitude !== null ? 'WGS84' : '')],
  ['coordinateUncertaintyInMeters', (r) => r.coordinateUncertaintyInMeters ?? null],
  ['habitat', (r) => r.habitatType],
  ['substrate', (r) => r.substrate],
  ['associatedTaxa', (r) => (r.hostSpecies ? `host: ${r.hostSpecies}` : '')],
  ['institutionCode', (r) => r.herbariumCode],
  ['catalogNumber', (r) => r.accessionNumber],
  // Sampling-event terms: an occurrence belongs to its sampling unit's event,
  // whose parent is the survey (see toEventsCsv).
  ['eventID', (r) => eventIdFor(r.surveyId, r.samplingUnitId)],
  ['parentEventID', (r) => (r.surveyId && r.samplingUnitId ? r.surveyId : '')],
  ['samplingProtocol', (r) => r.survey?.protocol ?? ''],
  ['samplingEffort', (r) => r.survey?.effort ?? ''],
  ['occurrenceStatus', () => 'present'],
  ['organismQuantity', (r) => (r.organismQuantityType === 'sporocarps' ? r.organismQuantity : null)],
  ['organismQuantityType', (r) => (r.organismQuantityType === 'sporocarps' ? 'sporocarps' : '')],
  [
    'occurrenceRemarks',
    (r) => [r.sporePrintColor && `spore print ${r.sporePrintColor}`, sporeSummary(r)].filter(Boolean).join('; '),
  ],
];

// A cell starting with one of these is run as a formula by Excel, LibreOffice
// and Google Sheets (CSV injection). Plain numbers such as -74.004 are safe.
const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

export const csvCell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  // Neutralise formulas with a leading apostrophe, as OWASP recommends.
  if (FORMULA_START.test(s) && !PLAIN_NUMBER.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (records) =>
  [
    DWC_COLUMNS.map(([h]) => h).join(','),
    ...records.map((r) => DWC_COLUMNS.map(([, f]) => csvCell(f(r))).join(',')),
  ].join('\n');

const isoInterval = (start, end) => (start ? (end ? `${start}/${end}` : start) : '');

const unitRemarks = (survey, u) => {
  if (Number.isFinite(u.x) && Number.isFinite(u.y)) return `position x=${u.x} m, y=${u.y} m from plot reference corner`;
  if (u.meta?.transect) return `transect ${u.meta.transect}, ${u.meta.fromM}–${u.meta.toM} m`;
  if (survey.method === 'substrate' && u.meta)
    return [
      `decay class ${u.meta.decayClass}`,
      u.meta.lengthM ? `length ${u.meta.lengthM} m` : '',
      u.meta.diameterCm ? `diameter ${u.meta.diameterCm} cm` : '',
      u.meta.note,
    ]
      .filter(Boolean)
      .join('; ');
  return '';
};

export const EVENT_COLUMNS = [
  'eventID',
  'parentEventID',
  'eventType',
  'eventDate',
  'samplingProtocol',
  'sampleSizeValue',
  'sampleSizeUnit',
  'samplingEffort',
  'locality',
  'decimalLatitude',
  'decimalLongitude',
  'geodeticDatum',
  'eventRemarks',
];

/**
 * Darwin Core Event table for a survey: one parent event for the survey and one
 * child event per completed sampling unit (GBIF sampling-event dataset layout).
 */
export const surveyEvents = (survey) => {
  const p = normaliseParams(survey.method, survey.params);
  const size = sampleSize(survey);
  const site = survey.site ?? {};
  const base = {
    locality: site.locality ?? '',
    decimalLatitude: site.latitude ?? null,
    decimalLongitude: site.longitude ?? null,
    geodeticDatum: site.latitude != null ? 'WGS84' : '',
  };
  const date = isoInterval(survey.startedAt, survey.endedAt);
  const rows = [
    {
      eventID: survey.id,
      parentEventID: '',
      eventType: 'Survey',
      eventDate: date,
      samplingProtocol: samplingProtocol(survey),
      sampleSizeValue: size?.value ?? null,
      sampleSizeUnit: size?.unit ?? '',
      samplingEffort: samplingEffort(survey),
      ...base,
      eventRemarks: [survey.name, survey.notes].filter(Boolean).join('; '),
    },
  ];
  for (const u of (survey.units ?? []).filter((x) => x.done)) {
    const area = unitAreaM2(survey.method, p, u);
    rows.push({
      eventID: eventIdFor(survey.id, u.id),
      parentEventID: survey.id,
      eventType: 'Sample',
      eventDate: date,
      samplingProtocol: samplingProtocol(survey),
      sampleSizeValue: area ? Number(area.toFixed(2)) : null,
      sampleSizeUnit: area ? 'square metre' : '',
      samplingEffort: '',
      ...base,
      eventRemarks: [u.label, unitRemarks(survey, u)].filter(Boolean).join('; '),
    });
  }
  return rows;
};

export const toEventsCsv = (survey) =>
  [
    EVENT_COLUMNS.join(','),
    ...surveyEvents(survey).map((row) => EVENT_COLUMNS.map((c) => csvCell(row[c])).join(',')),
  ].join('\n');

/** Save text as a file (browser download). */
export const downloadText = (text, filename, type = 'text/csv;charset=utf-8') => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
