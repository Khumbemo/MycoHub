import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { localDb } from './db';
import type { Observation } from '../types';

export const saveObservation = async (observation: Omit<Observation, 'id'>, photos: File[]) => {
  // 1. Save to IndexedDB immediately (Offline-first)
  const tempId = Math.random().toString(36).slice(2);
  const localObs = { ...observation, id: tempId, status: 'UNVERIFIED' as const };
  await localDb.observations.add(localObs);

  // 2. Try to sync to Firebase if online
  try {
    // Upload photos first
    const mediaUrls = await Promise.all(photos.map(async (file) => {
      const storageRef = ref(storage, `observations/${tempId}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    }));

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'observations'), {
      ...observation,
      media: mediaUrls.map(url => ({ url, type: 'HABITAT' })), // Simplified for now
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update local DB with the real Firestore ID
    await localDb.observations.update(tempId, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.warn("Offline: Data saved locally and will sync later.", error);
    return tempId;
  }
};
