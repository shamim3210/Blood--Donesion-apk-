import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
          type: 'module',
        },
        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'assets/bloodsearch-logo-squircle.png',
          '.well-known/assetlinks.json',
        ],
        manifest: {
          id: '/',
          name: 'BloodSearch - Bangladesh Emergency Blood Network',
          short_name: 'BloodSearch',
          description:
            'জরুরি রক্তদাতা সন্ধান, ৬৪ জেলা হাসপাতাল ডিরেক্টরি ও লাইভ ব্লাড ডোনেশন নেটওয়ার্ক বাংলাদেশ।',
          theme_color: '#dc2626',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['medical', 'health', 'utilities'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'জরুরি রক্তের আবেদন (SOS)',
              short_name: 'জরুরি SOS',
              description: '১-ক্লিকে মুমূর্ষু রোগীর জন্য জরুরি রক্তের আবেদন পাঠান',
              url: '/?action=sos',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'রক্তদাতা খুঁজুন (৬৪ জেলা)',
              short_name: 'ডোনার সার্চ',
              description: 'নিকটস্থ প্রস্তুত রক্তদাতা খুঁজুন',
              url: '/?action=search',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'লাইভ চ্যাট ও ইনবক্স',
              short_name: 'লাইভ চ্যাট',
              description: 'রক্তদাতাদের সাথে সরাসরি চ্যাট ও লোকেশন শেয়ার',
              url: '/?action=chat',
              icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          // Never intercept API routes, Firebase Auth handler (/__/auth/handler), or Android TWA assetlinks
          navigateFallbackDenylist: [/^\/api\//, /^\/__/, /^\/\.well-known\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 12,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
