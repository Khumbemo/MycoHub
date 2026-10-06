const KEY = 'mycohub.theme';
const media = () => window.matchMedia?.('(prefers-color-scheme: dark)');

export const getThemePref = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
};

export const applyTheme = (pref = getThemePref()) => {
  const dark = pref === 'dark' || (pref === 'system' && !!media()?.matches);
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b1512' : '#059669');
};

export const setThemePref = (pref) => {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // storage blocked: still applies for this session
  }
  applyTheme(pref);
};

/** Apply the saved theme now and follow the OS setting while on "system". */
export const initTheme = () => {
  applyTheme();
  media()?.addEventListener?.('change', () => applyTheme());
};
