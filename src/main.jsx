import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTheme } from './utils/theme';
// Fonts are bundled so the app looks the same offline in the field.
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource-variable/newsreader/wght.css';
import '@fontsource-variable/newsreader/wght-italic.css';
import './index.css';

initTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
