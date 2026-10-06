// End-to-end test of the sync engine: real Firebase JS SDK + security rules,
// talking to the emulators; IndexedDB comes from fake-indexeddb.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Node has no navigator.onLine; the app checks it before syncing.
Object.defineProperty(globalThis.navigator, 'onLine', { value: true, configurable: true });

const { auth, db } = await import('../../src/firebase/config');
const { localDb } = await import('../../src/utils/db');
const { syncNow } = await import('../../src/utils/sync');
const obs = await import('../../src/utils/observations');

let env;

const signIn = async (email) => {
  await signOut(auth);
  try {
    await createUserWithEmailAndPassword(auth, email, 'password123');
  } catch {
    await signInWithEmailAndPassword(auth, email, 'password123');
  }
  return auth.currentUser;
};

const draft = (userId, overrides = {}) => ({
  userId,
  collectorName: 'Alice',
  collectionNumber: 'SYNC-1',
  timestamp: '2026-10-04T12:00:00.000Z',
  locality: 'Plot A',
  latitude: 41.378,
  longitude: -74.004,
  coordinateUncertaintyInMeters: 12,
  scientificName: 'Amanita muscaria',
  identificationConfidence: 'PROBABLE',
  capDiameterMm: '80',
  capShape: 'convex',
  capColor: 'red',
  hymeniumType: 'Gills',
  gillSpacing: 'Close',
  attachment: 'free',
  odor: '',
  bruising: '',
  koh: '',
  feso4: '',
  taste: '',
  sporePrintColor: 'white',
  sporeMeasurements: '9 x 7, 10 x 7.5',
  melzers: 'INAMYLOID',
  clampConnections: 'ABSENT',
  trophicMode: 'ECTOMYCORRHIZAL',
  substrate: 'SOIL',
  hostSpecies: 'Betula',
  habitatType: 'BROADLEAF_WOODLAND',
  preserved: false,
  dnaExtracted: false,
  herbariumCode: '',
  accessionNumber: '',
  photos: [new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], { type: 'image/jpeg' })],
  ...overrides,
});

const serverDoc = async (remoteId) => {
  let data;
  await env.withSecurityRulesDisabled(async (ctx) => {
    data = (await getDoc(doc(ctx.firestore(), 'observations', remoteId))).data();
  });
  return data;
};

beforeAll(async () => {
  // Load the real rules into the emulator so the sync runs under them.
  env = await initializeTestEnvironment({
    projectId: 'demo-mycohub',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  });
  await env.clearFirestore();
  expect(db).toBeTruthy();
});

afterAll(async () => {
  await signOut(auth);
  await env?.cleanup();
});

describe('sync engine against the emulators', () => {
  let recordId = '';
  let remoteId = '';

  it('uploads a new record with its photo', async () => {
    const alice = await signIn('alice@example.org');
    const { id, synced } = await obs.saveObservation(draft(alice.uid));
    recordId = id;
    expect(synced).toBe(true);

    const local = await localDb.observations.get(id);
    expect(local).toMatchObject({ synced: true, dirty: false });
    remoteId = local.remoteId;
    expect(local.mediaUrls).toHaveLength(1);

    const server = await serverDoc(remoteId);
    expect(server).toMatchObject({
      userId: alice.uid,
      status: 'UNVERIFIED',
      scientificName: 'Amanita muscaria',
      coordinateUncertaintyInMeters: 12,
      sporeMeasurements: '9 x 7, 10 x 7.5',
    });
  });

  it('pushes edits to the existing server document', async () => {
    await obs.updateObservation(recordId, { locality: 'Plot B' });
    expect((await localDb.observations.get(recordId)).dirty).toBe(false);
    expect((await serverDoc(remoteId)).locality).toBe('Plot B');
  });

  it('lets another user pull the record and add an identification', async () => {
    const bob = await signIn('bob@example.org');
    await syncNow();
    const local = await localDb.observations.get(recordId);
    await obs.addIdentification(
      local,
      { id: bob.uid, displayName: 'Bob', role: 'COLLECTOR', email: '', joinedAt: new Date() },
      'Amanita muscaria',
    );
    await syncNow();

    let idDoc;
    await env.withSecurityRulesDisabled(async (ctx) => {
      idDoc = (await getDoc(doc(ctx.firestore(), 'observations', remoteId, 'identifications', bob.uid))).data();
    });
    expect(idDoc).toMatchObject({ userId: bob.uid, role: 'COLLECTOR', taxon: 'Amanita muscaria' });
    const after = await localDb.observations.get(recordId);
    expect(after.identifications.find((i) => i.userId === bob.uid)?.pending).toBeFalsy();
    // Owner's name + Bob's agreement: community grade (no identifier yet)
    expect(obs.displayStatus(after)).toBe('COMMUNITY_GRADE');
  });

  it('records a server refusal instead of retrying forever', async () => {
    // Bob is a collector: the rules refuse his manual status change.
    const local = await localDb.observations.get(recordId);
    await obs.setManualStatus(local, 'FLAGGED');
    await syncNow();
    const after = await localDb.observations.get(recordId);
    expect(after.statusDirty).toBe(false);
    expect(after.syncError).toMatch(/refused/);
    expect((await serverDoc(remoteId)).status).toBe('UNVERIFIED');
  });

  it('adopts offline-session records when someone signs in', async () => {
    const carol = await signIn('carol@example.org');
    await signOut(auth); // save while signed out, as an offline session would
    const { id, synced } = await obs.saveObservation(draft('local-123', { collectionNumber: 'OFF-1' }));
    expect(synced).toBe(false);
    await signInWithEmailAndPassword(auth, 'carol@example.org', 'password123');
    await syncNow();
    const local = await localDb.observations.get(id);
    expect(local.userId).toBe(carol.uid);
    expect(local.synced).toBe(true);
  });

  it('deletes the server copy on the next sync', async () => {
    await signInWithEmailAndPassword(auth, 'alice@example.org', 'password123');
    await syncNow(); // pick up the latest server state, including Bob's identification
    const local = await localDb.observations.get(recordId);
    await obs.deleteObservation(local);
    await syncNow();
    expect(await localDb.observations.get(recordId)).toBeUndefined();
    expect(await serverDoc(remoteId)).toBeUndefined();
    expect(await localDb.deletions.count()).toBe(0);
  });
});
