import { describe, expect, it } from 'vitest';
import { computeConsensus } from './consensus';

const base = { ownerId: 'obs', ownerTaxon: 'Amanita muscaria', hasDate: true, hasCoordinates: true };

describe('computeConsensus', () => {
  it("leaves a record with only the observer's name unverified", () => {
    expect(computeConsensus({ ...base, identifications: [] })).toMatchObject({ status: 'UNVERIFIED', votes: 1 });
  });

  it('reaches community grade with two agreeing non-experts', () => {
    const r = computeConsensus({ ...base, identifications: [{ userId: 'b', role: 'COLLECTOR', taxon: 'amanita  muscaria' }] });
    expect(r).toMatchObject({ status: 'COMMUNITY_GRADE', taxon: 'Amanita muscaria', votes: 2, agreeing: 2 });
  });

  it('reaches research grade when an identifier agrees and the record is georeferenced and dated', () => {
    const ids = [{ userId: 'ida', role: 'IDENTIFIER' as const, taxon: 'Amanita muscaria' }];
    expect(computeConsensus({ ...base, identifications: ids }).status).toBe('RESEARCH_GRADE');
    expect(computeConsensus({ ...base, hasCoordinates: false, identifications: ids }).status).toBe('COMMUNITY_GRADE');
  });

  it('requires more than two thirds agreement', () => {
    // 2 of 3 is exactly 2/3, which is not enough
    const r = computeConsensus({
      ...base,
      identifications: [
        { userId: 'b', role: 'IDENTIFIER', taxon: 'Amanita muscaria' },
        { userId: 'c', role: 'IDENTIFIER', taxon: 'Amanita pantherina' },
      ],
    });
    expect(r).toMatchObject({ status: 'UNVERIFIED', disputed: true, votes: 3, agreeing: 2 });

    // 3 of 4 (75%) is enough
    const r2 = computeConsensus({
      ...base,
      identifications: [
        { userId: 'b', role: 'IDENTIFIER', taxon: 'Amanita muscaria' },
        { userId: 'c', role: 'COLLECTOR', taxon: 'Amanita pantherina' },
        { userId: 'd', role: 'COLLECTOR', taxon: 'Amanita muscaria' },
      ],
    });
    expect(r2.status).toBe('RESEARCH_GRADE');
  });

  it("uses the observer's later identification instead of their original name", () => {
    const r = computeConsensus({
      ...base,
      identifications: [
        { userId: 'obs', role: 'COLLECTOR', taxon: 'Amanita pantherina' },
        { userId: 'b', role: 'COLLECTOR', taxon: 'Amanita pantherina' },
      ],
    });
    expect(r).toMatchObject({ status: 'COMMUNITY_GRADE', taxon: 'Amanita pantherina', votes: 2 });
  });

  it('counts one vote per person', () => {
    const r = computeConsensus({
      ...base,
      identifications: [
        { userId: 'b', role: 'COLLECTOR', taxon: 'Boletus edulis' },
        { userId: 'b', role: 'COLLECTOR', taxon: 'Amanita muscaria' },
      ],
    });
    expect(r.votes).toBe(2);
    expect(r.status).toBe('COMMUNITY_GRADE');
  });
});
