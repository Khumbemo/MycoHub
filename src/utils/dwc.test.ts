import { describe, expect, it } from 'vitest';
import { csvCell, toCsv, DWC_COLUMNS } from './dwc';
import type { FieldRecord } from '../types';

const record = (overrides: Partial<FieldRecord> = {}): FieldRecord => ({
  id: 'local-1', userId: 'u1', collectorName: 'Jane Doe', collectionNumber: 'JD-001',
  timestamp: '2026-10-04T12:00:00.000Z', status: 'UNVERIFIED', synced: false,
  locality: 'Black Rock Forest, NY', latitude: 41.378, longitude: -74.004,
  scientificName: 'Amanita muscaria', identificationConfidence: 'PROBABLE',
  capDiameterMm: '', capShape: '', capColor: '', hymeniumType: 'Gills', gillSpacing: 'Close', attachment: '',
  odor: '', bruising: '', koh: '', feso4: '', taste: '',
  trophicMode: 'ECTOMYCORRHIZAL', substrate: 'SOIL', hostSpecies: 'Betula', habitatType: 'BROADLEAF_WOODLAND',
  preserved: true, dnaExtracted: false, herbariumCode: 'NY', accessionNumber: '123',
  photos: [], mediaUrls: [],
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
    const cells = row.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, ''));
    const get = (term: string) => cells[cols.indexOf(term)];
    expect(get('basisOfRecord')).toBe('PreservedSpecimen');
    expect(get('eventDate')).toBe('2026-10-04');
    expect(get('locality')).toBe('"Black Rock Forest, NY"');
    expect(get('decimalLatitude')).toBe('41.378');
    expect(get('geodeticDatum')).toBe('WGS84');
    expect(get('kingdom')).toBe('Fungi');
  });

  it('leaves geodeticDatum empty when there are no coordinates', () => {
    const [header, row] = toCsv([record({ latitude: null, longitude: null, preserved: false })]).split('\n');
    const cols = header.split(',');
    const cells = row.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, ''));
    expect(cells[cols.indexOf('geodeticDatum')]).toBe('');
    expect(cells[cols.indexOf('basisOfRecord')]).toBe('HumanObservation');
  });
});
