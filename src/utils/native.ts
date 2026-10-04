import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

export const isNative = () => Capacitor.isNativePlatform();

export interface Fix {
  latitude: number;
  longitude: number;
  /** Horizontal accuracy radius in metres at 95% confidence, rounded up. */
  accuracy: number;
}

/**
 * Android reports accuracy as a 68% confidence radius; browsers (W3C) report 95%.
 * For a circular 2-D normal error the radius holding probability p is
 * σ·√(−2 ln(1 − p)), so R95 / R68 = √(−2 ln 0.05) / √(−2 ln 0.32) ≈ 1.62.
 */
export const ANDROID_68_TO_95 = Math.sqrt(-2 * Math.log(0.05)) / Math.sqrt(-2 * Math.log(0.32));
export const toUncertaintyMetres = (accuracy: number, native: boolean) =>
  Math.ceil(native ? accuracy * ANDROID_68_TO_95 : accuracy);

const OPTIONS = { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 };

/** Current position from the native plugin on Android, or the browser API on the web. */
export const getCurrentFix = async (): Promise<Fix> => {
  if (isNative()) {
    const perm = await Geolocation.requestPermissions({ permissions: ['location'] });
    if (perm.location === 'denied') throw new Error('Location permission was denied. Enable it in Android settings.');
    const pos = await Geolocation.getCurrentPosition(OPTIONS);
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: toUncertaintyMetres(pos.coords.accuracy, true) };
  }
  if (!('geolocation' in navigator)) throw new Error('This device does not provide location. Enter coordinates by hand.');
  const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, OPTIONS),
  ).catch(() => {
    throw new Error('Location permission was denied or unavailable. Enter coordinates by hand.');
  });
  return { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: toUncertaintyMetres(pos.coords.accuracy, false) };
};

/** Take a photo with the native camera (Android). Returns null if the user cancels. */
export const takeNativePhoto = async (): Promise<File | null> => {
  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Prompt, // camera or gallery
      resultType: CameraResultType.Uri,
      quality: 85,
      width: 2048,
      correctOrientation: true,
      saveToGallery: false,
    });
    if (!photo.webPath) return null;
    const blob = await (await fetch(photo.webPath)).blob();
    return new File([blob], `photo-${Date.now()}.${photo.format || 'jpeg'}`, { type: blob.type || 'image/jpeg' });
  } catch (e) {
    if (String(e).toLowerCase().includes('cancel')) return null;
    throw e;
  }
};
