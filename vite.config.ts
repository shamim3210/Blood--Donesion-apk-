import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function readPackageVersion(): string {
  try {
    const raw = fs.readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8');
    const parsed = JSON.parse(raw) as { version?: string };
    return parsed.version || '2.5.0';
  } catch {
    return '2.5.0';
  }
}

function bloodsearchVersionManifestPlugin(version: string, buildId: string): Plugin {
  const payload = JSON.stringify({
    version,
    buildId,
    builtAt: new Date().toISOString(),
  });

  return {
    name: 'bloodsearch-version-manifest',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.end(payload);
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: payload,
      });
    },
  };
}

export default defineConfig(() => {
  const appVersion = readPackageVersion();
  const appBuildId = process.env.BUILD_ID || `${appVersion}-${Date.now()}`;

  return {
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_BUILD_ID__: JSON.stringify(appBuildId),
    },
    plugins: [
      react(),
      tailwindcss(),
      bloodsearchVersionManifestPlugin(appVersion, appBuildId),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: false,
          type: 'module',
        },
        includeAssets: [
          'favicon-64x64.png',
          'icon.svg',
          'apple-touch-icon.png',
          'assets/aistudio/image_771fa3d8.png',
          'assets/bloodsearch-emblem-mark.png',
          'assets/bloodsearch-logo-squircle.png',
          '.well-known/assetlinks.json',
        ],
        manifest: {
          id: '/',
          name: 'BloodSearch - Bangladesh Emergency Blood Network',
          short_name: 'BloodSearch',
          description:
            'জরুরি রক্তদাতা সন্ধান, ৬৪ জেলা হাসপাতাল ডিরেক্টরি ও লাইভ ব্লাড ডোনেশন নেটওয়ার্ক বাংলাদেশ।',
          lang: 'bn',
          dir: 'ltr',
          theme_color: '#0b2239',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          prefer_related_applications: false,
          launch_handler: {
            client_mode: 'navigate-existing',
          },
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
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
          globIgnores: ['**/version.json'],
          cleanupOutdatedCaches: true,
          // Never intercept API routes, live version manifest, Firebase Auth handler, or Android TWA assetlinks
          navigateFallbackDenylist: [/^\/api\//, /^\/version\.json/, /^\/__/, /^\/\.well-known\//],
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
            {
              urlPattern: /^https:\/\/(?:[abc]\.tile\.openstreetmap\.org|[abcd]\.basemaps\.cartocdn\.com)\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'bangladesh-map-tiles-cache',
                expiration: {
                  maxEntries: 250,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
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
