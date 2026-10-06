import { describe, expect, it, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@capacitor/camera', () => ({ Camera: {}, CameraResultType: {}, CameraSource: {} }));
vi.mock('@capacitor/geolocation', () => ({ Geolocation: {} }));

const { ANDROID_68_TO_95, toUncertaintyMetres } = await import('./native');

describe('toUncertaintyMetres', () => {
  it('converts an Android 68% radius to 95%', () => {
    expect(ANDROID_68_TO_95).toBeCloseTo(1.6214, 3);
    expect(toUncertaintyMetres(10, true)).toBe(17); // 16.2 → rounded up
  });

  it('keeps browser (already 95%) values, rounded up', () => {
    expect(toUncertaintyMetres(12.2, false)).toBe(13);
  });
});
