import { useEffect, useState } from 'react';
import { liveQuery } from 'dexie';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { localDb } from './db';
import type { FieldRecord } from '../types';

export { shannonIndex, speciesCounts } from './stats';

const SYNC_TIMEOUT_MS = 15000;

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Sync timed out')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Try to push one local record to Firebase. Returns true when it synced. */
export const syncRecord = async (record: FieldRecord): Promise<boolean> => {
  // Firestore rules require a signed-in Firebase user; offline sessions stay local.
  // The record must belong to the signed-in account (storage and Firestore rules enforce this too).
  if (!db || !storage || !auth?.currentUser || !navigator.onLine) return false;
  const uid = auth.currentUser.uid;
  // Records made in an offline session belong to whoever signs in on this device.
  if (record.userId.startsWith('local-')) {
    record = { ...record, userId: uid };
    await localDb.observations.update(record.id, { userId: uid });
  }
  if (record.userId !== uid) return false;

  try {
    await withTimeout((async () => {
      const mediaUrls = await Promise.all(record.photos.map(async (blob, i) => {
        const storageRef = ref(storage!, `observations/${record.userId}/${record.id}/photo-${i + 1}`);
        const snapshot = await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
        return getDownloadURL(snapshot.ref);
      }));

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { photos, synced, remoteId, ...data } = record;
      const docRef = await addDoc(collection(db!, 'observations'), {
        ...data,
        mediaUrls,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await localDb.observations.update(record.id, { synced: true, remoteId: docRef.id, mediaUrls });
    })(), SYNC_TIMEOUT_MS);
    return true;
  } catch (error) {
    console.warn('Sync failed; the record is kept locally.', error);
    return false;
  }
};

/** Save offline-first: write to IndexedDB, then attempt a cloud sync. */
export const saveObservation = async (
  draft: Omit<FieldRecord, 'id' | 'status' | 'synced' | 'mediaUrls'>,
): Promise<{ id: string; synced: boolean }> => {
  const record: FieldRecord = { ...draft, id: newId(), status: 'UNVERIFIED', synced: false, mediaUrls: [] };
  await localDb.observations.add(record);
  const synced = await syncRecord(record);
  return { id: record.id, synced };
};

/** Live list of locally stored records, newest first. `null` while loading. */
export const useLocalRecords = (): FieldRecord[] | null => {
  const [records, setRecords] = useState<FieldRecord[] | null>(null);

  useEffect(() => {
    const subscription = liveQuery(() =>
      localDb.observations.orderBy('timestamp').reverse().toArray()
    ).subscribe({
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

export const formatRelative = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
};
