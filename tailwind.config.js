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
    extend: {
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
