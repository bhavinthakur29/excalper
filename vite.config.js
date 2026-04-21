import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

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
  plugins: [htmlPublicUrlPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
})
