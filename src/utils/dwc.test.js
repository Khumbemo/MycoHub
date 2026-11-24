import { describe, expect, it } from 'vitest';
import { csvCell, toCsv, DWC_COLUMNS, EVENT_COLUMNS, surveyEvents, toEventsCsv } from './dwc';

const record = (overrides = {}) => ({
  id: 'local-1',
  userId: 'u1',
  collectorName: 'Jane Doe',
  collectionNumber: 'JD-001',
  timestamp: '2026-10-04T12:00:00.000Z',
  status: 'UNVERIFIED',
  synced: false,
  locality: 'Black Rock Forest, NY',
  latitude: 41.378,
  longitude: -74.004,
  scientificName: 'Amanita muscaria',
  identificationConfidence: 'PROBABLE',
  capDiameterMm: '',
  capShape: '',
  capColor: '',
  hymeniumType: 'Gills',
  gillSpacing: 'Close',
  attachment: '',
  odor: '',
  bruising: '',
  koh: '',
  feso4: '',
  taste: '',
  trophicMode: 'ECTOMYCORRHIZAL',
  substrate: 'SOIL',
  hostSpecies: 'Betula',
  habitatType: 'BROADLEAF_WOODLAND',
  preserved: true,
  dnaExtracted: false,
  herbariumCode: 'NY',
  accessionNumber: '123',
  photos: [],
  mediaUrls: [],
  identifications: [],
  coordinateUncertaintyInMeters: 15,
  sporePrintColor: 'white',
  sporeMeasurements: '9 x 7, 10 x 7.5',
  melzers: 'INAMYLOID',
  clampConnections: 'ABSENT',
  updatedAt: '2026-10-04T12:00:00.000Z',
  dirty: false,
  statusDirty: false,
  syncAttempts: 0,
  nextSyncAt: 0,
  taxonomy: {
    taxonKey: 2524566,
    matchedName: 'Amanita muscaria (L.) Lam.',
    acceptedName: 'Amanita muscaria (L.) Lam.',
    rank: 'SPECIES',
    status: 'ACCEPTED',
    matchType: 'EXACT',
    confidence: 99,
    family: 'Amanitaceae',
    order: 'Agaricales',
  },
  ...overrides,
});

describe('csvCell', () => {
  it('quotes values containing commas, quotes or newlines', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('writes null as an empty cell', () => {
    expect(csvCell(null)).toBe('');
  });

  it('quotes carriage returns so a value cannot split the row', () => {
    expect(csvCell('a\rb')).toBe('"a\rb"');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://x","y")')).toBe(`"'=HYPERLINK(""http://x"",""y"")"`);
    expect(csvCell('+cmd')).toBe("'+cmd");
    expect(csvCell('-2+3')).toBe("'-2+3");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell('\tx')).toBe("'\tx");
  });

  it('leaves plain numbers alone, including negative coordinates', () => {
    expect(csvCell(-74.004)).toBe('-74.004');
    expect(csvCell('-74.004')).toBe('-74.004');
    expect(csvCell('+1.5e3')).toBe('+1.5e3');
    expect(csvCell(0)).toBe('0');
  });
});

describe('toCsv', () => {
  it('uses Darwin Core term names as the header', () => {
    const header = toCsv([]).split('\n')[0].split(',');
    expect(header).toEqual(DWC_COLUMNS.map(([h]) => h));
    expect(header).toContain('decimalLatitude');
    expect(header).toContain('eventDate');
  });

  it('maps a preserved specimen to the right DwC values', () => {
    const [header, row] = toCsv([record()]).split('\n');
    const cols = header.split(',');
    const cells = row.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, ''));
    const get = (term) => cells[cols.indexOf(term)];
    expect(get('basisOfRecord')).toBe('PreservedSpecimen');
    expect(get('eventDate')).toBe('2026-10-04');
    expect(get('locality')).toBe('"Black Rock Forest, NY"');
    expect(get('decimalLatitude')).toBe('41.378');
    expect(get('geodeticDatum')).toBe('WGS84');
    expect(get('kingdom')).toBe('Fungi');
    expect(get('family')).toBe('Amanitaceae');
    expect(get('taxonID')).toBe('https://www.gbif.org/species/2524566');
    expect(get('coordinateUncertaintyInMeters')).toBe('15');
    expect(get('identificationVerificationStatus')).toBe('UNVERIFIED');
    expect(get('occurrenceRemarks')).toContain('spore print white; spores 9.0–10.0 × 7.0–7.5 µm');
  });

  it('leaves geodeticDatum empty when there are no coordinates', () => {
    const [header, row] = toCsv([record({ latitude: null, longitude: null, preserved: false })]).split('\n');
    const cols = header.split(',');
    const cells = row.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map((c) => c.replace(/,$/, ''));
    expect(cells[cols.indexOf('geodeticDatum')]).toBe('');
    expect(cells[cols.indexOf('basisOfRecord')]).toBe('HumanObservation');
  });
});

describe('sampling-event export', () => {
  const survey = {
    id: 'sv1',
    name: 'Plot A',
    method: 'quadrat',
    params: { sideM: 2, count: 2, placement: 'subjective', plotWidthM: 20, plotLengthM: 20, observers: 1 },
    units: [
      { id: 'Q1', label: 'Q1', done: true },
      { id: 'Q2', label: 'Q2', done: false },
    ],
    site: { locality: 'Black Rock', latitude: 41.4, longitude: -74 },
    startedAt: '2026-10-04T09:00:00.000Z',
    endedAt: '2026-10-04T10:00:00.000Z',
    notes: '',
  };

  it('writes a parent survey event and one child event per completed unit', () => {
    const rows = surveyEvents(survey);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      eventID: 'sv1',
      parentEventID: '',
      eventType: 'Survey',
      eventDate: '2026-10-04T09:00:00.000Z/2026-10-04T10:00:00.000Z',
      sampleSizeValue: 4,
      sampleSizeUnit: 'square metre',
      geodeticDatum: 'WGS84',
    });
    expect(rows[1]).toMatchObject({ eventID: 'sv1:Q1', parentEventID: 'sv1', sampleSizeValue: 4, eventType: 'Sample' });
    expect(toEventsCsv(survey).split('\n')[0]).toBe(EVENT_COLUMNS.join(','));
  });

  it('links occurrences to their sampling-unit event, with counts', () => {
    const [header, row] = toCsv([
      record({
        locality: 'Black Rock', // no comma, so the row can be split naively
        surveyId: 'sv1',
        samplingUnitId: 'Q1',
        organismQuantity: 7,
        organismQuantityType: 'sporocarps',
        survey: { protocol: 'Quadrats', effort: '1 observer' },
      }),
    ]).split('\n');
    const cols = header.split(',');
    const cell = (name) => row.split(',')[cols.indexOf(name)];
    expect(cell('eventID')).toBe('sv1:Q1');
    expect(cell('parentEventID')).toBe('sv1');
    expect(cell('organismQuantity')).toBe('7');
    expect(cell('organismQuantityType')).toBe('sporocarps');
    expect(cell('occurrenceStatus')).toBe('present');
  });
});
