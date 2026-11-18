import { recordConsensus } from './consensus';
import { formatSporeStats, parseSporeMeasurements, sporeStats } from './microscopy';

const sporeSummary = (r) => {
  const s = sporeStats(parseSporeMeasurements(r.sporeMeasurements ?? '').spores);
  return s ? `spores ${formatSporeStats(s)}` : '';
};

// Column headers are Darwin Core term names so the file can be mapped straight into GBIF's IPT.
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
