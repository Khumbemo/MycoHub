const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.85;

/** Scale (w, h) down to fit within max × max, keeping the aspect ratio. Never scales up. */
export const fitWithin = (w, h, max = MAX_EDGE) => {
  const scale = Math.min(1, max / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
};

/**
 * Downscale a photo to at most 2048 px on its longest edge and re-encode as JPEG,
 * so the device's storage quota lasts. Returns the original if it is already
 * small enough or the browser can't decode it.
 */
export const compressImage = async (file) => {
  if (!file.type.startsWith('image/') || typeof createImageBitmap !== 'function') return file;
  try {
    // imageOrientation applies EXIF rotation so portrait photos stay upright.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    if (width === bitmap.width && file.size < 1_500_000) {
      bitmap.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
};
