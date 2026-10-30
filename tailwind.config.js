// Layout breakpoints. Keep these media queries in sync with src/utils/layout.js
// and the --nav-bottom rule in src/index.css.
//   (default)  phone portrait: top header + bottom tab bar
//   rail:      tablets, and phones in landscape: icon rail on the left
//   wide:      laptops and desktops: full sidebar with labels
//   short:     landscape phones (little height): compact chrome
export const RAIL_QUERY = '(min-width: 768px), (min-width: 560px) and (max-height: 520px) and (orientation: landscape)';
export const WIDE_QUERY = '(min-width: 1024px)';
export const SHORT_QUERY = '(max-height: 520px) and (orientation: landscape)';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    // Corner radii: crisp, instrument-like rather than pill-shaped.
    borderRadius: {
      none: '0',
      sm: '4px',
      DEFAULT: '6px',
      md: '8px',
      lg: '10px',
      xl: '12px',
      '2xl': '14px',
      '3xl': '18px',
      full: '9999px',
    },
    extend: {
      // Design tokens. `emerald` and `gray` are remapped so every page picks up
      // the palette: moss greens (forest floor) and lichen neutrals with a slight
      // green bias. Text pairs are checked to WCAG AA (≥ 4.5:1).
      colors: {
        emerald: {
          50: '#EEF3EE',
          100: '#DCE8DE',
          200: '#B9D1BE',
          300: '#8DB397',
          400: '#5F9170',
          500: '#3F7454',
          600: '#2D5C41',
          700: '#234A34',
          800: '#1B3A29',
          900: '#132A1E',
          950: '#0B1A12',
        },
        gray: {
          50: '#F5F6F3',
          100: '#EBEDE8',
          200: '#DADED6',
          300: '#BFC5BC',
          400: '#959D91',
          500: '#6A7366',
          600: '#535B50',
          700: '#3F463D',
          800: '#2A2F29',
          900: '#1A1E19',
          950: '#0F120E',
        },
        paper: '#F7F8F5',
        ink: '#16211A',
        // Fly agaric red: the illustration's accent, never a status colour.
        agaric: '#C8372D',
      },
      // Quiet, hairline depth instead of coloured glows.
      boxShadow: {
        sm: '0 1px 2px rgb(22 33 26 / 0.05)',
        DEFAULT: '0 1px 3px rgb(22 33 26 / 0.06), 0 1px 2px rgb(22 33 26 / 0.04)',
        md: '0 2px 6px rgb(22 33 26 / 0.07)',
        lg: '0 4px 12px rgb(22 33 26 / 0.08)',
        xl: '0 6px 18px rgb(22 33 26 / 0.09)',
        '2xl': '0 12px 32px rgb(22 33 26 / 0.12)',
      },
      fontFamily: {
        // UI text, specimen labels and figures, and display/taxon names.
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"Newsreader Variable"', 'Newsreader', 'Georgia', '"Times New Roman"', 'serif'],
      },
      // Raw screens are emitted after the default ones and in this order, so
      // `wide:` overrides `rail:` and both override `sm:`…`2xl:`.
      screens: {
        rail: { raw: RAIL_QUERY },
        short: { raw: SHORT_QUERY },
        wide: { raw: WIDE_QUERY },
      },
    },
  },
  plugins: [],
};
