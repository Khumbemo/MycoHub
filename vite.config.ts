import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // `vite build --mode standalone` makes one self-contained bundle (no service
  // worker, no code splitting) for hosts that serve a single HTML file.
  const standalone = mode === 'standalone';

  return {
    // Relative asset paths so the build works from any sub-path, file:// and Capacitor.
    base: './',
    plugins: [
      react(),
      !standalone && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'MycoHub Research',
          short_name: 'MycoHub',
          description: 'Scientific Mycological Data Collection & Research Platform',
          theme_color: '#059669',
          background_color: '#f8faf9',
          display: 'standalone',
          start_url: './',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
    build: {
      outDir: standalone ? 'dist-standalone' : 'dist',
      assetsInlineLimit: standalone ? 100_000_000 : 4096,
      // The standalone bundle is deliberately one file.
      chunkSizeWarningLimit: standalone ? 2000 : 500,
      rollupOptions: {
        output: standalone
          ? { inlineDynamicImports: true }
          : {
              manualChunks: {
                'firebase-firestore': ['firebase/firestore'],
                'firebase-core': ['firebase/app', 'firebase/auth', 'firebase/storage'],
                vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'dexie'],
              },
            },
      },
    },
  };
});
