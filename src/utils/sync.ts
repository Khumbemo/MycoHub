import { useSyncExternalStore } from 'react';
import {
  collection, collectionGroup, deleteDoc, doc, getDocs, limit, orderBy, query,
  serverTimestamp, setDoc, updateDoc, addDoc, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { localDb } from './db';
import { roleFromClaims } from './roles';
import type { FieldRecord, Identification, UserRole } from '../types';

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested)
// ---------------------------------------------------------------------------

/** Retry delay after `attempts` consecutive failures: 15 s, 30 s, 1 min … capped at 30 min. */
export const backoffMs = (attempts: number): number =>
  Math.min(30 * 60_000, 15_000 * 2 ** Math.max(0, attempts - 1));

/** Fields the owner may write. Must match the allow-list in firestore.rules. */
export const CONTENT_FIELDS = [
  'collectorName', 'collectionNumber', 'timestamp',
  'locality', 'latitude', 'longitude', 'coordinateUncertaintyInMeters',
  'scientificName', 'identificationConfidence', 'taxonomy',
  'capDiameterMm', 'capShape', 'capColor', 'hymeniumType', 'gillSpacing', 'attachment',
  'odor', 'bruising', 'koh', 'feso4', 'taste',
  'sporePrintColor', 'sporeMeasurements', 'melzers', 'clampConnections',
  'trophicMode', 'substrate', 'hostSpecies', 'habitatType',
  'preserved', 'dnaExtracted', 'herbariumCode', 'accessionNumber',
] as const satisfies readonly (keyof FieldRecord)[];

/** The owner-editable content of a record, without undefined values (Firestore rejects them). */
export const contentPayload = (r: FieldRecord): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const key of CONTENT_FIELDS) {
    if (r[key] !== undefined) out[key] = r[key];
  }
  return out;
};

const isPermissionError = (e: unknown) =>
  typeof e === 'object' && e !== null && 'code' in e &&
  ['permission-denied', 'storage/unauthorized', 'unauthenticated'].includes(String((e as { code: string }).code).replace(/^firestore\//, ''));

const toIso = (v: unknown, fallback: string): string =>
  v instanceof Timestamp ? v.toDate().toISOString() : typeof v === 'string' ? v : fallback;

// ---------------------------------------------------------------------------
// Observable sync state for the UI
// ---------------------------------------------------------------------------

export interface SyncState {
  running: boolean;
  lastSyncedAt: number | null;
  lastError: string | null;
}

let state: SyncState = { running: false, lastSyncedAt: null, lastError: null };
const listeners = new Set<() => void>();
const setState = (patch: Partial<SyncState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const useSyncState = (): SyncState =>
  useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
  );

// ---------------------------------------------------------------------------
// Sync engine
// ---------------------------------------------------------------------------

const SYNC_TIMEOUT_MS = 30_000;
const PULL_LIMIT = 300;

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });

export interface SyncReport {
  pushed: number;
  failed: number;
  pulled: number;
  skipped?: string;
}

const canSync = () => !!(db && storage && auth?.currentUser && navigator.onLine);

const uploadPhotos = async (r: FieldRecord): Promise<string[]> => {
  const urls = await Promise.all(r.photos.map(async (blob, i) => {
    const photoRef = ref(storage!, `observations/${r.userId}/${r.id}/photo-${i + 1}`);
    const snap = await uploadBytes(photoRef, blob, { contentType: blob.type || 'image/jpeg' });
    return getDownloadURL(snap.ref);
  }));
  // Remove photos that were deleted locally since the last upload.
  for (let i = r.photos.length; i < r.mediaUrls.length; i++) {
    await deleteObject(ref(storage!, `observations/${r.userId}/${r.id}/photo-${i + 1}`)).catch(() => undefined);
  }
  return urls;
};

/** Push one record's pending changes. Throws on failure. */
const pushRecord = async (r: FieldRecord, uid: string, role: UserRole, userName: string) => {
  const owned = r.userId === uid;

  if (owned && (!r.synced || r.dirty)) {
    // Records pulled onto a new device have no local photo blobs; keep their server photos.
    const mediaUrls = r.photos.length > 0 || !r.synced ? await uploadPhotos(r) : r.mediaUrls;
    if (!r.remoteId) {
      const docRef = await addDoc(collection(db!, 'observations'), {
        ...contentPayload(r),
        id: r.id,
        userId: uid,
        status: 'UNVERIFIED',
        mediaUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await localDb.observations.update(r.id, { remoteId: docRef.id, synced: true, dirty: false, mediaUrls });
      r = { ...r, remoteId: docRef.id };
    } else {
      await updateDoc(doc(db!, 'observations', r.remoteId), {
        ...contentPayload(r),
        mediaUrls,
        updatedAt: serverTimestamp(),
      });
      await localDb.observations.update(r.id, { synced: true, dirty: false, mediaUrls });
    }
  }

  if (r.remoteId && r.statusDirty) {
    await updateDoc(doc(db!, 'observations', r.remoteId), { status: r.status, updatedAt: serverTimestamp() });
    await localDb.observations.update(r.id, { statusDirty: false });
  }

  const pendingIds = r.identifications.filter((i) => i.pending && i.userId === uid);
  if (r.remoteId && pendingIds.length > 0) {
    const mine = pendingIds[pendingIds.length - 1];
    await setDoc(doc(db!, 'observations', r.remoteId, 'identifications', uid), {
      userId: uid,
      userName,
      role,
      taxon: mine.taxon,
      ...(mine.comment ? { comment: mine.comment } : {}),
      createdAt: serverTimestamp(),
    });
    await localDb.observations.update(r.id, {
      identifications: r.identifications.map((i) => (i.userId === uid ? { ...i, pending: false, role } : i)),
    });
  }
};

const processDeletions = async (uid: string) => {
  for (const d of await localDb.deletions.toArray()) {
    if (d.userId !== uid) continue;
    try {
      await deleteDoc(doc(db!, 'observations', d.remoteId));
      for (let i = 1; i <= d.photoCount; i++) {
        await deleteObject(ref(storage!, `observations/${d.userId}/${d.localId}/photo-${i}`)).catch(() => undefined);
      }
      await localDb.deletions.delete(d.remoteId);
    } catch (e) {
      if (isPermissionError(e)) await localDb.deletions.delete(d.remoteId);
      else throw e;
    }
  }
};

/** Download recent server records and identifications into the local database. */
const pull = async (): Promise<number> => {
  const snap = await getDocs(query(collection(db!, 'observations'), orderBy('createdAt', 'desc'), limit(PULL_LIMIT)));
  const idSnap = await getDocs(query(collectionGroup(db!, 'identifications'), limit(PULL_LIMIT * 5)));

  const idsByRecord = new Map<string, Identification[]>();
  for (const d of idSnap.docs) {
    const parentId = d.ref.parent.parent?.id;
    if (!parentId) continue;
    const data = d.data();
    const list = idsByRecord.get(parentId) ?? [];
    list.push({
      userId: String(data.userId),
      userName: String(data.userName ?? ''),
      role: data.role as UserRole,
      taxon: String(data.taxon ?? ''),
      ...(data.comment ? { comment: String(data.comment) } : {}),
      createdAt: toIso(data.createdAt, new Date(0).toISOString()),
    });
    idsByRecord.set(parentId, list);
  }

  let count = 0;
  await localDb.transaction('rw', localDb.observations, localDb.deletions, async () => {
    for (const d of snap.docs) {
      if (await localDb.deletions.get(d.id)) continue; // deleted here, waiting to push
      const data = d.data();
      const local =
        (await localDb.observations.where('remoteId').equals(d.id).first()) ??
        (data.id ? await localDb.observations.get(String(data.id)) : undefined);
      if (local && (local.dirty || local.statusDirty)) continue; // local edits win until pushed

      const serverIds = idsByRecord.get(d.id) ?? [];
      const pendingLocal = (local?.identifications ?? []).filter(
        (i) => i.pending && !serverIds.some((s) => s.userId === i.userId),
      );

      const merged: FieldRecord = {
        // defaults for fields older server copies may lack
        coordinateUncertaintyInMeters: null, sporePrintColor: '', sporeMeasurements: '',
        melzers: 'NOT_TESTED', clampConnections: 'NOT_SEEN', identificationConfidence: 'PROBABLE',
        capDiameterMm: '', capShape: '', capColor: '', hymeniumType: '', gillSpacing: '', attachment: '',
        odor: '', bruising: '', koh: '', feso4: '', taste: '', hostSpecies: '', herbariumCode: '', accessionNumber: '',
        trophicMode: 'SAPROTROPHIC', substrate: 'SOIL', habitatType: 'BROADLEAF_WOODLAND',
        preserved: false, dnaExtracted: false, locality: '', latitude: null, longitude: null,
        ...(local ?? {}),
        ...(data as Partial<FieldRecord>),
        id: local?.id ?? String(data.id ?? d.id),
        remoteId: d.id,
        photos: local?.photos ?? [],
        mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : [],
        identifications: [...serverIds, ...pendingLocal],
        updatedAt: toIso(data.updatedAt, local?.updatedAt ?? new Date().toISOString()),
        synced: true,
        dirty: false,
        statusDirty: false,
        syncAttempts: 0,
        nextSyncAt: 0,
        // Keep a refusal message so the user can see why their change was undone.
        syncError: local?.syncError,
      } as FieldRecord;
      delete (merged as unknown as Record<string, unknown>).createdAt;
      await localDb.observations.put(merged);
      count++;
    }
  });
  return count;
};

const run = async (): Promise<SyncReport> => {
  if (!canSync()) return { pushed: 0, failed: 0, pulled: 0, skipped: 'Sign in and go online to sync.' };
  const user = auth!.currentUser!;
  const uid = user.uid;
  const role = roleFromClaims((await user.getIdTokenResult()).claims);
  const userName = user.displayName || (user.isAnonymous ? 'Guest Researcher' : 'Researcher');

  // Records made in an offline session belong to whoever signs in on this device.
  await localDb.observations.filter((r) => r.userId.startsWith('local-')).modify({ userId: uid });

  await processDeletions(uid);

  const now = Date.now();
  const due = await localDb.observations
    .filter((r) =>
      r.nextSyncAt <= now && (
        (r.userId === uid && (!r.synced || r.dirty)) ||
        r.statusDirty ||
        r.identifications.some((i) => i.pending && i.userId === uid)
      ))
    .toArray();

  let pushed = 0;
  let failed = 0;
  for (const r of due) {
    try {
      await withTimeout(pushRecord(r, uid, role, userName), SYNC_TIMEOUT_MS);
      await localDb.observations.update(r.id, { syncAttempts: 0, nextSyncAt: 0, syncError: undefined });
      pushed++;
    } catch (e) {
      failed++;
      if (isPermissionError(e)) {
        // Retrying won't help; keep the data locally and say why.
        await localDb.observations.update(r.id, {
          statusDirty: false,
          syncError: 'The server refused this change (not allowed for your role).',
        });
      } else {
        const attempts = r.syncAttempts + 1;
        await localDb.observations.update(r.id, {
          syncAttempts: attempts,
          nextSyncAt: Date.now() + backoffMs(attempts),
          syncError: e instanceof Error ? e.message : 'Sync failed',
        });
      }
    }
  }

  let pulled = 0;
  try {
    pulled = await withTimeout(pull(), SYNC_TIMEOUT_MS);
  } catch (e) {
    console.warn('Pull failed:', e);
  }

  return { pushed, failed, pulled };
};

let inFlight: Promise<SyncReport> | null = null;

/** Run one sync pass. Concurrent calls share the pass already running. */
export const syncNow = (): Promise<SyncReport> => {
  if (inFlight) return inFlight;
  setState({ running: true });
  inFlight = run()
    .then((report) => {
      setState({
        running: false,
        lastSyncedAt: report.skipped ? state.lastSyncedAt : Date.now(),
        lastError: report.failed > 0 ? `${report.failed} record${report.failed === 1 ? '' : 's'} failed to sync; will retry.` : null,
      });
      return report;
    })
    .catch((e) => {
      setState({ running: false, lastError: e instanceof Error ? e.message : 'Sync failed' });
      return { pushed: 0, failed: 0, pulled: 0, skipped: 'error' } as SyncReport;
    })
    .finally(() => { inFlight = null; });
  return inFlight;
};

const SYNC_INTERVAL_MS = 5 * 60_000;

/** Sync on start, when the device comes online, when the app is reopened, and every 5 minutes. */
export const startAutoSync = (): (() => void) => {
  const trigger = () => { void syncNow(); };
  const onVisible = () => { if (document.visibilityState === 'visible') trigger(); };
  window.addEventListener('online', trigger);
  document.addEventListener('visibilitychange', onVisible);
  const interval = window.setInterval(trigger, SYNC_INTERVAL_MS);
  trigger();
  return () => {
    window.removeEventListener('online', trigger);
    document.removeEventListener('visibilitychange', onVisible);
    window.clearInterval(interval);
  };
};
