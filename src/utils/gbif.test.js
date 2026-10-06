import { describe, expect, it, vi } from 'vitest';
import { canonicalName, matchName } from './gbif';

const json = (body, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body });

describe('matchName', () => {
  it('returns an exact accepted match with classification', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      json({
        usageKey: 2524566,
        scientificName: 'Amanita muscaria (L.) Lam.',
        rank: 'SPECIES',
        status: 'ACCEPTED',
        confidence: 99,
        matchType: 'EXACT',
        kingdom: 'Fungi',
        phylum: 'Basidiomycota',
        class: 'Agaricomycetes',
        order: 'Agaricales',
        family: 'Amanitaceae',
        genus: 'Amanita',
      }),
    );
    const r = await matchName('Amanita muscaria', fetchMock);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.gbif.org/v1/species/match?kingdom=Fungi&name=Amanita%20muscaria',
    );
    expect(r).toMatchObject({
      kind: 'match',
      match: { family: 'Amanitaceae', acceptedName: 'Amanita muscaria (L.) Lam.', matchType: 'EXACT' },
    });
  });

  it('resolves a synonym to its accepted name', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        json({
          usageKey: 1,
          acceptedUsageKey: 2524566,
          scientificName: 'Agaricus muscarius L.',
          rank: 'SPECIES',
          status: 'SYNONYM',
          confidence: 98,
          matchType: 'EXACT',
          kingdom: 'Fungi',
          family: 'Amanitaceae',
        }),
      )
      .mockResolvedValueOnce(json({ key: 2524566, scientificName: 'Amanita muscaria (L.) Lam.' }));
    const r = await matchName('Agaricus muscarius', fetchMock);
    expect(fetchMock).toHaveBeenLastCalledWith('https://api.gbif.org/v1/species/2524566');
    expect(r).toMatchObject({
      kind: 'match',
      match: { status: 'SYNONYM', matchedName: 'Agaricus muscarius L.', acceptedName: 'Amanita muscaria (L.) Lam.' },
    });
  });

  it('reports no match', async () => {
    const r = await matchName(
      'Notarealname fakeus',
      vi.fn().mockResolvedValue(json({ matchType: 'NONE', confidence: 100 })),
    );
    expect(r).toEqual({ kind: 'none' });
  });

  it('reports network failures without throwing', async () => {
    const r = await matchName('Amanita', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(r.kind).toBe('error');
  });
});

describe('canonicalName', () => {
  it('drops the authorship', () => {
    expect(canonicalName('Amanita muscaria (L.) Lam.', 'SPECIES')).toBe('Amanita muscaria');
    expect(canonicalName('Cantharellus cibarius Fr.', 'SPECIES')).toBe('Cantharellus cibarius');
    expect(canonicalName('Amanita Pers.', 'GENUS')).toBe('Amanita');
    expect(canonicalName('Amanita muscaria var. guessowii Veselý', 'VARIETY')).toBe('Amanita muscaria var. guessowii');
  });
});
