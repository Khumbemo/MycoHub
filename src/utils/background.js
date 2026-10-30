import { useEffect, useState, useSyncExternalStore } from 'react';
import { liveQuery } from 'dexie';
import { localDb } from './db';
import { compressImage } from './images';

/** @typedef {'mycelium' | 'illustration' | 'photo' | 'plain'} BackgroundMode */

export const DEFAULT_BACKGROUND = 'mycelium';

const KEY = 'mycohub.background';
const PHOTO_KEY = 'backgroundPhoto';
const listeners = new Set();

/** @returns {BackgroundMode} */
export const getBackgroundMode = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'illustration' || v === 'photo' || v === 'plain' ? v : DEFAULT_BACKGROUND;
  } catch {
    return DEFAULT_BACKGROUND;
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
  if (getBackgroundMode() === 'photo') setBackgroundMode(DEFAULT_BACKGROUND);
};

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/**
 * Current background choice and, in photo mode, an object URL for the photo.
 * Falls back to the default if photo mode is chosen but no photo is stored.
 */
export const useBackground = () => {
  const chosen = useSyncExternalStore(subscribe, getBackgroundMode, () => DEFAULT_BACKGROUND);
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

  const mode = chosen === 'photo' && photo === null ? DEFAULT_BACKGROUND : chosen;
  return { mode, chosen, photoUrl, hasPhoto: !!photo };
};
