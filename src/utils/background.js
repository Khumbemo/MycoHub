import { useEffect, useState, useSyncExternalStore } from 'react';
import { liveQuery } from 'dexie';
import { localDb } from './db';
import { compressImage } from './images';

/** @typedef {'illustration' | 'photo' | 'plain'} BackgroundMode */

const KEY = 'mycohub.background';
const PHOTO_KEY = 'backgroundPhoto';
const listeners = new Set();

/** @returns {BackgroundMode} */
export const getBackgroundMode = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'photo' || v === 'plain' ? v : 'illustration';
  } catch {
    return 'illustration';
  }
};

/** @param {BackgroundMode} mode */
export const setBackgroundMode = (mode) => {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    // storage blocked: applies until the page is closed
  }
  listeners.forEach((l) => l());
};

/** Store a photo (resized to 2048 px) as the background and switch to it. */
export const setBackgroundPhoto = async (file) => {
  const blob = await compressImage(file);
  await localDb.table('prefs').put({ key: PHOTO_KEY, blob });
  setBackgroundMode('photo');
};

export const clearBackgroundPhoto = async () => {
  await localDb.table('prefs').delete(PHOTO_KEY);
  if (getBackgroundMode() === 'photo') setBackgroundMode('illustration');
};

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/**
 * Current background choice and, in photo mode, an object URL for the photo.
 * Falls back to the illustration if photo mode is chosen but no photo is stored.
 */
export const useBackground = () => {
  const chosen = useSyncExternalStore(subscribe, getBackgroundMode, () => 'illustration');
  const [photo, setPhoto] = useState(/** @type {Blob | null | undefined} */ (undefined));

  useEffect(() => {
    const sub = liveQuery(() => localDb.table('prefs').get(PHOTO_KEY)).subscribe({
      next: (row) => setPhoto(row?.blob ?? null),
      error: () => setPhoto(null),
    });
    return () => sub.unsubscribe();
  }, []);

  const [photoUrl, setPhotoUrl] = useState(/** @type {string | null} */ (null));
  useEffect(() => {
    if (!photo) {
      setPhotoUrl(null);
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const mode = chosen === 'photo' && photo === null ? 'illustration' : chosen;
  return { mode, chosen, photoUrl, hasPhoto: !!photo };
};
