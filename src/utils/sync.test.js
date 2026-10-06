import { describe, expect, it, vi } from 'vitest';

// The sync module imports Firebase and IndexedDB; only its pure helpers are tested here.
vi.mock('../firebase/config', () => ({ auth: null, db: null, storage: null }));
vi.mock('./db', () => ({ localDb: {} }));

const { backoffMs, contentPayload, CONTENT_FIELDS } = await import('./sync');

describe('backoffMs', () => {
  it('doubles from 15 s and caps at 30 min', () => {
    expect(backoffMs(1)).toBe(15_000);
    expect(backoffMs(2)).toBe(30_000);
    expect(backoffMs(5)).toBe(240_000);
    expect(backoffMs(20)).toBe(30 * 60_000);
  });
});

describe('contentPayload', () => {
  it('contains only owner-editable fields and drops undefined', () => {
    const payload = contentPayload({
      scientificName: 'Amanita muscaria',
      taxonomy: undefined,
      status: 'RESEARCH_GRADE',
      userId: 'x',
      photos: [],
    });
    expect(payload).toEqual({ scientificName: 'Amanita muscaria' });
  });

  it('matches the allow-list in firestore.rules', async () => {
    const { readFileSync } = await import('node:fs');
    const rules = readFileSync('firestore.rules', 'utf8');
    for (const field of CONTENT_FIELDS) expect(rules).toContain(`'${field}'`);
  });
});
