import { useSyncExternalStore } from 'react';
import { RAIL_QUERY, WIDE_QUERY } from '../../tailwind.config.js';

export { RAIL_QUERY, WIDE_QUERY };

const subscribe = (query) => (onChange) => {
  const mql = window.matchMedia?.(query);
  mql?.addEventListener?.('change', onChange);
  return () => mql?.removeEventListener?.('change', onChange);
};

/** True while the media query matches; follows rotation and window resizes. */
export const useMediaQuery = (query) =>
  useSyncExternalStore(
    subscribe(query),
    () => !!window.matchMedia?.(query).matches,
    () => false,
  );
