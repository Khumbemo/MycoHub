// Integration test: writes go to the Firestore emulator, the real Cloud Function
// runs in the Functions emulator, and we wait for it to update the observation.
import { beforeAll, describe, expect, it } from 'vitest';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';

let db: Firestore;

beforeAll(() => {
  if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run with `npm run test:functions` (needs the emulators).');
  if (!getApps().length) initializeApp({ projectId: 'demo-mycohub' });
  db = getFirestore();
});

const waitFor = async <T,>(read: () => Promise<T>, done: (v: T) => boolean, ms = 30000): Promise<T> => {
  const end = Date.now() + ms;
  let v = await read();
  while (!done(v) && Date.now() < end) {
    await new Promise((r) => setTimeout(r, 300));
    v = await read();
  }
  return v;
};

const seed = async (id: string, extra: Record<string, unknown> = {}) => {
  await db.doc(`observations/${id}`).set({
    id, userId: 'alice', collectorName: 'Alice', collectionNumber: id, timestamp: '2026-10-04T12:00:00.000Z',
    status: 'UNVERIFIED', scientificName: 'Amanita muscaria', latitude: 41.378, longitude: -74.004,
    createdAt: Timestamp.now(), updatedAt: Timestamp.now(), ...extra,
  });
};

const identify = (obs: string, uid: string, role: string, taxon: string) =>
  db.doc(`observations/${obs}/identifications/${uid}`).set({ userId: uid, userName: uid, role, taxon, createdAt: Timestamp.now() });

const status = (id: string) => async () => (await db.doc(`observations/${id}`).get()).data()!;

describe('onIdentificationWrite', () => {
  it('moves a record to community grade, then research grade', async () => {
    await seed('f1');
    await identify('f1', 'bob', 'COLLECTOR', 'amanita muscaria');
    const a = await waitFor(status('f1'), (d) => d.status === 'COMMUNITY_GRADE');
    expect(a).toMatchObject({ status: 'COMMUNITY_GRADE', consensusTaxon: 'Amanita muscaria' });

    await identify('f1', 'ida', 'IDENTIFIER', 'Amanita muscaria');
    const b = await waitFor(status('f1'), (d) => d.status === 'RESEARCH_GRADE');
    expect(b.status).toBe('RESEARCH_GRADE');
  });

  it('drops back when an identification changes and the vote is split', async () => {
    await seed('f2');
    await identify('f2', 'bob', 'COLLECTOR', 'Amanita muscaria');
    await waitFor(status('f2'), (d) => d.status === 'COMMUNITY_GRADE');
    await identify('f2', 'bob', 'COLLECTOR', 'Amanita pantherina');
    const d = await waitFor(status('f2'), (x) => x.status === 'UNVERIFIED');
    expect(d.status).toBe('UNVERIFIED');
  });

  it('never overrides a manual flag', async () => {
    await seed('f3', { status: 'FLAGGED' });
    await identify('f3', 'bob', 'COLLECTOR', 'Amanita muscaria');
    await new Promise((r) => setTimeout(r, 3000));
    expect((await status('f3')()).status).toBe('FLAGGED');
  });
});
