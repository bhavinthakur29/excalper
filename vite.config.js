import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

/** CRA-style %PUBLIC_URL% in index.html (empty at root, or path prefix with subpath `base`) */
function htmlPublicUrlPlugin() {
  let publicUrlPrefix = ''
  return {
    name: 'html-replace-public-url',
    configResolved(config) {
      const base = config.base || '/'
      if (base === '/' || base === './') {
        publicUrlPrefix = ''
      } else {
        publicUrlPrefix = base.replace(/\/$/, '')
      }
    },
    transformIndexHtml(html) {
      return html.replace(/%PUBLIC_URL%/g, publicUrlPrefix)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    htmlPublicUrlPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.json',
      includeAssets: ['og-image.jpg', 'default-avatar.svg'],
      manifest: {
        name: 'Excalper',
        short_name: 'Excalper',
        description: 'Track spending with clarity — Excalper personal finance.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#0f172a',
        icons: [
          {
            src: '/og-image.jpg',
            sizes: '1200x630',
            type: 'image/jpeg',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'excalper-pages',
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: ({ request }) => ['script', 'style', 'font', 'image'].includes(request.destination),
            handler: 'CacheFirst',
            options: {
              cacheName: 'excalper-assets',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
})
