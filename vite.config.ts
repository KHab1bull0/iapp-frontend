/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Was enabled so the PWA could be installed straight off the dev server.
      // It also means `npm run dev` runs behind a service worker that serves
      // its own cached copies of the very files you are editing. Given that
      // stale caching is what hid three separate fixes from the device, dev
      // now runs without one; test installs with `npm run build && npm run
      // preview`, which serves a real service worker.
      devOptions: {
        enabled: false,
      },
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        // Without an explicit id the install identity is derived from
        // start_url, so ever changing start_url would register as a second,
        // separate app rather than an update of this one.
        id: "/",
        name: "IAPP",
        short_name: "IAPP",
        description: "Shaxsiy hayot tizimi",
        lang: "uz",
        dir: "ltr",
        categories: ["productivity", "lifestyle", "finance"],
        // Matches --bg (light) and the <meta name="theme-color"> in
        // index.html. It was #16A34A, so an installed app launched with a
        // green status bar sitting directly above a near-white header.
        // ThemeContext re-points the meta tag when the theme changes.
        theme_color: "#F8FAFC",
        // Splash background must match the app's default (light) --bg, otherwise
        // launch goes dark-green -> white on every cold start.
        background_color: "#F8FAFC",
        display: "standalone",
        // It was ["standalone", "fullscreen"]: evaluated in order with the
        // first supported value winning, so "fullscreen" was unreachable and
        // the field only restated `display`. minimal-ui is an actual fallback
        // — a browser without standalone lands there rather than in a full
        // browser window.
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "manifest-icon-192.maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "manifest-icon-512.maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        // Drop precaches from superseded builds instead of letting them
        // accumulate in Cache Storage.
        cleanupOutdatedCaches: true,
        // Offline deep links: opening /transactions directly with no network
        // has to resolve to the app shell.
        navigateFallback: "/index.html",
        // ...but never for the API. A navigation to /api/* answered with
        // index.html is an HTML body where JSON is expected.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\//i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              // Offline, the fetch would otherwise hang on the OS timeout
              // before falling back to cache. Five seconds and it serves what
              // it has.
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // The stylesheet above was cached but the actual .woff2 files live on
            // gstatic — without this the PWA lost Inter entirely when offline.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  // Surfaced in Settings → About. An installed PWA can silently run a build
  // from weeks ago; without a visible stamp there is no way to tell whether a
  // fix reached the device, which is exactly how this went unnoticed.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
  server: {
    port: 4040,
    proxy: {
      '/api': {
        target: 'http://localhost:3005', // must match backend/.env PORT
        changeOrigin: true,
      },
    },
  },
});
