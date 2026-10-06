import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { localDb } from './db';
import { syncNow } from './sync';
import { recordConsensus } from './consensus';

export { shannonIndex, speciesCounts } from './stats';

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const SAVE_SYNC_WAIT_MS = 8000;

/** Wait briefly for a sync pass so the UI can say whether the record reached the cloud. */
const syncAndCheck = async (id) => {
  await Promise.race([syncNow(), new Promise((r) => setTimeout(r, SAVE_SYNC_WAIT_MS))]);
  const r = await localDb.observations.get(id);
  return !!r?.synced && !r.dirty;
};

/** Save offline-first: write to IndexedDB, then attempt a cloud sync. */
export const saveObservation = async (draft) => {
  const record = {
    ...draft,
    id: newId(),
    status: 'UNVERIFIED',
    identifications: [],
    mediaUrls: [],
    updatedAt: new Date().toISOString(),
    synced: false,
    dirty: false,
    statusDirty: false,
    syncAttempts: 0,
    nextSyncAt: 0,
  };
  await localDb.observations.add(record);
  return { id: record.id, synced: await syncAndCheck(record.id) };
};

/** Save edits to an existing record and queue them for upload. */
export const updateObservation = async (id, patch) => {
  await localDb.observations.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
    dirty: true,
    syncAttempts: 0,
    nextSyncAt: 0,
    syncError: undefined,
  });
  return { synced: await syncAndCheck(id) };
};

/** Delete locally now; delete the server copy on the next sync. */
export const deleteObservation = async (r) => {
  await localDb.transaction('rw', localDb.observations, localDb.deletions, async () => {
    if (r.remoteId) {
      await localDb.deletions.put({
        remoteId: r.remoteId,
        userId: r.userId,
        localId: r.id,
        photoCount: Math.max(r.photos.length, r.mediaUrls.length),
      });
    }
    await localDb.observations.delete(r.id);
  });
  void syncNow();
};

/** Add or replace the current user's identification of a record. */
export const addIdentification = async (r, user, taxon, comment) => {
  const others = r.identifications.filter((i) => i.userId !== user.id);
  await localDb.observations.update(r.id, {
    identifications: [
      ...others,
      {
        userId: user.id,
        userName: user.displayName,
        role: user.role,
        taxon: taxon.trim(),
        ...(comment?.trim() ? { comment: comment.trim() } : {}),
        createdAt: new Date().toISOString(),
        pending: true,
      },
    ],
    nextSyncAt: 0,
  });
  void syncNow();
};

/** Manual status change (flagging). Only identifiers can push this to the server. */
export const setManualStatus = async (r, status) => {
  await localDb.observations.update(r.id, { status, statusDirty: r.synced, nextSyncAt: 0 });
  void syncNow();
};

/**
 * Status shown in the app. FLAGGED is a manual status; otherwise it is the
 * identification consensus (the same rule the server's Cloud Function applies).
 */
export const displayStatus = (r) => (r.status === 'FLAGGED' ? 'FLAGGED' : recordConsensus(r).status);

/** Live list of locally stored records, newest first. `null` while loading. */
export const useLocalRecords = () => {
  const [records, setRecords] = useState(null);

  useEffect(() => {
    const subscription = liveQuery(() => localDb.observations.orderBy('timestamp').reverse().toArray()).subscribe({
      next: setRecords,
      error: (error) => {
        console.error('Local database unavailable:', error);
        setRecords([]);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  return records;
};

/** Live single record. `undefined` while loading, `null` if it doesn't exist. */
export const useLocalRecord = (id) => {
  const [record, setRecord] = useState(undefined);

  useEffect(() => {
    if (!id) {
      setRecord(null);
      return;
    }
    const subscription = liveQuery(() => localDb.observations.get(id)).subscribe({
      next: (r) => setRecord(r ?? null),
      error: () => setRecord(null),
    });
    return () => subscription.unsubscribe();
  }, [id]);

  return record;
};

export const formatRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
};
