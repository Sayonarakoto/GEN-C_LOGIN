import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['images/*.jpeg', 'images/*.png', 'sounds/*.mp3'],
      manifest: {
        name: 'GEN-C Login',
        short_name: 'GEN-C',
        description: 'GEN-C Portal - Late Entry, Gate Pass & more',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/images/genc-log.jpeg',
            sizes: '192x192',
            type: 'image/jpeg',
            purpose: 'any'
          },
          {
            src: '/images/genc-log.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ],
        categories: ['education', 'productivity']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpeg,svg,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/unpkg\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unpkg-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],
  base: "/",
  server: {
    port: 5173,
    host: true,
    cors: true,
    historyApiFallback: true,
    // ✅ FIXED: Add exact ngrok domain + wildcard
    allowedHosts: [
      'aeruginous-sharon-accountably.ngrok-free.dev',  // Your exact domain
      '.ngrok-free.app', 
      '.ngrok.io',
      'localhost'
    ],
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  }
});
