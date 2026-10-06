import { describe, expect, it } from 'vitest';
import { emptyForm, parseCoord, validate, localDateString } from './fieldForm';

describe('parseCoord', () => {
  it('returns null for blank input', () => {
    expect(parseCoord('', 90)).toBeNull();
    expect(parseCoord('   ', 90)).toBeNull();
  });

  it('parses decimal degrees within range', () => {
    expect(parseCoord('-33.988', 90)).toBe(-33.988);
    expect(parseCoord('180', 180)).toBe(180);
  });

  it('rejects out-of-range and non-numeric values', () => {
    expect(parseCoord('91', 90)).toBeUndefined();
    expect(parseCoord('-180.1', 180)).toBeUndefined();
    expect(parseCoord('41°22′N', 90)).toBeUndefined();
  });
});

describe('validate', () => {
  const filled = () => ({ ...emptyForm('Jane'), collectionNumber: 'JD-1', scientificName: 'Amanita muscaria' });

  it('accepts a minimal complete record', () => {
    expect(validate(filled())).toEqual({});
  });

  it('requires collector, collection number and name', () => {
    const errors = validate(emptyForm(''));
    expect(Object.keys(errors).sort()).toEqual(['collectionNumber', 'collectorName', 'scientificName']);
  });

  it('flags invalid coordinates', () => {
    const errors = validate({ ...filled(), latitude: '95', longitude: 'abc' });
    expect(errors.latitude).toBeDefined();
    expect(errors.longitude).toBeDefined();
  });
});

describe('localDateString', () => {
  it('formats the local calendar date as YYYY-MM-DD', () => {
    expect(localDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
