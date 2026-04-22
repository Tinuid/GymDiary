import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/GymDiary/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'GymDiary',
        short_name: 'GymDiary',
        description: 'Trainingsgewichte tracken im Fitnessstudio',
        lang: 'de',
        start_url: '/GymDiary/',
        scope: '/GymDiary/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111418',
        theme_color: '#111418',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,svg,woff2}'],
      },
    }),
  ],
});
