import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collectionGroup, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

let env: RulesTestEnvironment;

const record = (userId: string, overrides: Record<string, unknown> = {}) => ({
  id: 'local-1',
  userId,
  collectorName: 'Jane Doe',
  collectionNumber: 'JD-001',
  timestamp: '2026-10-04T12:00:00.000Z',
  status: 'UNVERIFIED',
  locality: 'Black Rock Forest',
  latitude: 41.378,
  longitude: -74.004,
  scientificName: 'Amanita muscaria',
  identificationConfidence: 'PROBABLE',
  preserved: false,
  dnaExtracted: false,
  mediaUrls: [],
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});

const profile = (uid: string, role = 'COLLECTOR') => ({
  id: uid, email: `${uid}@example.org`, displayName: uid, role, joinedAt: new Date(),
});

const asUser = (uid: string, role?: string) =>
  env.authenticatedContext(uid, role ? { role } : {}).firestore();

/** Seed a stored observation owned by `owner`, bypassing rules. */
const seed = async (id: string, owner: string, overrides: Record<string, unknown> = {}) => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'observations', id), {
      ...record(owner, overrides),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });
};

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-mycohub',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('users/{uid}', () => {
  it('lets a user create their own COLLECTOR profile', async () => {
    await assertSucceeds(setDoc(doc(asUser('alice'), 'users/alice'), profile('alice')));
  });

  it('blocks creating a profile with an elevated role', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'users/alice'), profile('alice', 'ADMIN')));
    await assertFails(setDoc(doc(asUser('alice'), 'users/alice'), profile('alice', 'IDENTIFIER')));
  });

  it("blocks writing someone else's profile", async () => {
    await assertFails(setDoc(doc(asUser('mallory'), 'users/alice'), profile('alice')));
  });

  it('blocks changing your own role later', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'users/alice'), profile('alice')));
    await assertFails(updateDoc(doc(asUser('alice'), 'users/alice'), { role: 'ADMIN' }));
    await assertSucceeds(updateDoc(doc(asUser('alice'), 'users/alice'), { displayName: 'Dr Alice' }));
  });

  it('blocks extra fields on create', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'users/alice'), { ...profile('alice'), isAdmin: true }));
  });

  it('only shows a profile to its owner or a curator', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'users/alice'), profile('alice')));
    await assertSucceeds(getDoc(doc(asUser('alice'), 'users/alice')));
    await assertFails(getDoc(doc(asUser('bob'), 'users/alice')));
    await assertSucceeds(getDoc(doc(asUser('carol', 'CURATOR'), 'users/alice')));
  });
});

describe('observations/{id}: create', () => {
  it('lets a signed-in user create their own UNVERIFIED record', async () => {
    await assertSucceeds(setDoc(doc(asUser('alice'), 'observations/o1'), record('alice')));
  });

  it('blocks unauthenticated writes and reads', async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(anon, 'observations/o1'), record('alice')));
    await assertFails(getDoc(doc(anon, 'observations/o1')));
  });

  it('blocks creating a record for another user', async () => {
    await assertFails(setDoc(doc(asUser('mallory'), 'observations/o1'), record('alice')));
  });

  it('blocks self-verifying on create', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'observations/o1'), record('alice', { status: 'RESEARCH_GRADE' })));
  });

  it('rejects invalid coordinates and missing names', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'observations/o1'), record('alice', { latitude: 91 })));
    await assertFails(setDoc(doc(asUser('alice'), 'observations/o2'), record('alice', { longitude: '18E' })));
    await assertFails(setDoc(doc(asUser('alice'), 'observations/o3'), record('alice', { scientificName: '' })));
  });

  it('accepts records without coordinates', async () => {
    await assertSucceeds(setDoc(doc(asUser('alice'), 'observations/o1'), record('alice', { latitude: null, longitude: null })));
  });

  it('rejects unknown fields and client-chosen timestamps', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'observations/o1'), record('alice', { verifiedBy: 'me' })));
    await assertFails(setDoc(doc(asUser('alice'), 'observations/o2'), record('alice', { createdAt: Timestamp.fromDate(new Date(2000, 0, 1)) })));
  });
});

describe('observations/{id}: update and delete', () => {
  it('lets the owner edit content but not the status', async () => {
    await seed('o1', 'alice');
    await assertSucceeds(updateDoc(doc(asUser('alice'), 'observations/o1'), { locality: 'Kirstenbosch' }));
    await assertFails(updateDoc(doc(asUser('alice'), 'observations/o1'), { status: 'RESEARCH_GRADE' }));
    await assertFails(updateDoc(doc(asUser('alice'), 'observations/o1'), { userId: 'bob' }));
  });

  it("blocks a collector from editing someone else's record", async () => {
    await seed('o1', 'alice');
    await assertFails(updateDoc(doc(asUser('bob'), 'observations/o1'), { scientificName: 'Boletus edulis' }));
    await assertFails(updateDoc(doc(asUser('bob'), 'observations/o1'), { status: 'FLAGGED' }));
  });

  it('lets an identifier change only the status', async () => {
    await seed('o1', 'alice');
    const ident = asUser('ida', 'IDENTIFIER');
    await assertSucceeds(updateDoc(doc(ident, 'observations/o1'), { status: 'RESEARCH_GRADE', updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(ident, 'observations/o1'), { scientificName: 'Amanita phalloides' }));
    await assertFails(updateDoc(doc(ident, 'observations/o1'), { status: 'PUBLISHED' }));
  });

  it('does not trust a role stored anywhere but the token', async () => {
    await seed('o1', 'alice');
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'users/bob'), profile('bob', 'ADMIN')));
    await assertFails(updateDoc(doc(asUser('bob'), 'observations/o1'), { status: 'RESEARCH_GRADE' }));
  });

  it('lets the owner or a curator delete', async () => {
    await seed('o1', 'alice');
    await seed('o2', 'alice');
    await seed('o3', 'alice');
    await assertFails(deleteDoc(doc(asUser('bob'), 'observations/o1')));
    await assertFails(deleteDoc(doc(asUser('ida', 'IDENTIFIER'), 'observations/o1')));
    await assertSucceeds(deleteDoc(doc(asUser('alice'), 'observations/o2')));
    await assertSucceeds(deleteDoc(doc(asUser('carol', 'CURATOR'), 'observations/o3')));
  });
});

describe('observations: science fields', () => {
  it('accepts coordinate uncertainty, GBIF taxonomy and microscopy', async () => {
    await assertSucceeds(setDoc(doc(asUser('alice'), 'observations/o1'), record('alice', {
      coordinateUncertaintyInMeters: 12,
      taxonomy: { taxonKey: 2524566, family: 'Amanitaceae', matchType: 'EXACT' },
      sporeMeasurements: '9 x 7, 10 x 7.5',
      sporePrintColor: 'white',
      melzers: 'INAMYLOID',
      clampConnections: 'ABSENT',
    })));
  });

  it('rejects a negative uncertainty and a non-map taxonomy', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'observations/o1'), record('alice', { coordinateUncertaintyInMeters: -5 })));
    await assertFails(setDoc(doc(asUser('alice'), 'observations/o2'), record('alice', { taxonomy: 'Amanitaceae' })));
  });

  it('does not let the owner set the consensus taxon', async () => {
    await seed('o1', 'alice');
    await assertFails(updateDoc(doc(asUser('alice'), 'observations/o1'), { consensusTaxon: 'Amanita muscaria' }));
  });
});

describe('observations/{id}/identifications/{uid}', () => {
  const ident = (uid: string, role = 'COLLECTOR', overrides: Record<string, unknown> = {}) => ({
    userId: uid, userName: uid, role, taxon: 'Amanita muscaria', createdAt: serverTimestamp(), ...overrides,
  });

  it('lets any signed-in user add their own identification', async () => {
    await seed('o1', 'alice');
    await assertSucceeds(setDoc(doc(asUser('bob'), 'observations/o1/identifications/bob'), ident('bob')));
    await assertSucceeds(setDoc(doc(asUser('ida', 'IDENTIFIER'), 'observations/o1/identifications/ida'), ident('ida', 'IDENTIFIER', { comment: 'Spores inamyloid' })));
  });

  it('blocks claiming a role the token does not have', async () => {
    await seed('o1', 'alice');
    await assertFails(setDoc(doc(asUser('bob'), 'observations/o1/identifications/bob'), ident('bob', 'IDENTIFIER')));
  });

  it("blocks writing someone else's identification", async () => {
    await seed('o1', 'alice');
    await assertFails(setDoc(doc(asUser('mallory'), 'observations/o1/identifications/bob'), ident('bob')));
    await assertFails(setDoc(doc(asUser('mallory'), 'observations/o1/identifications/mallory'), ident('bob')));
  });

  it('requires the observation to exist and a non-empty taxon', async () => {
    await assertFails(setDoc(doc(asUser('bob'), 'observations/missing/identifications/bob'), ident('bob')));
    await seed('o1', 'alice');
    await assertFails(setDoc(doc(asUser('bob'), 'observations/o1/identifications/bob'), ident('bob', 'COLLECTOR', { taxon: '' })));
    await assertFails(setDoc(doc(asUser('bob'), 'observations/o1/identifications/bob'), ident('bob', 'COLLECTOR', { verified: true })));
  });

  it('can be read by signed-in users, including as a collection group', async () => {
    await seed('o1', 'alice');
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'observations/o1/identifications/bob'), { ...ident('bob'), createdAt: Timestamp.now() }));
    await assertSucceeds(getDoc(doc(asUser('carol'), 'observations/o1/identifications/bob')));
    await assertSucceeds(getDocs(collectionGroup(asUser('carol'), 'identifications')));
    await assertFails(getDocs(collectionGroup(env.unauthenticatedContext().firestore(), 'identifications')));
  });

  it('lets people withdraw only their own identification', async () => {
    await seed('o1', 'alice');
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'observations/o1/identifications/bob'), { ...ident('bob'), createdAt: Timestamp.now() }));
    await assertFails(deleteDoc(doc(asUser('mallory'), 'observations/o1/identifications/bob')));
    await assertSucceeds(deleteDoc(doc(asUser('bob'), 'observations/o1/identifications/bob')));
  });
});

describe('other collections', () => {
  it('are closed by default', async () => {
    await assertFails(setDoc(doc(asUser('alice'), 'secrets/x'), { a: 1 }));
    await assertFails(getDoc(doc(asUser('alice', 'ADMIN'), 'secrets/x')));
  });
});
