import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const nativeBuild = process.env.VITE_CAPACITOR === '1'

export default defineConfig({
  base: nativeBuild ? './' : '/',
  server: {
    watch: {
      ignored: ['**/ios/**'],
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      injectRegister: null,
      minify: false,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Sankalpa Constructions',
        short_name: 'Sankalpa',
        description:
          'Track owner receipts, material credit, and labour kharchi across Bengaluru construction sites.',
        theme_color: '#f6f3ee',
        background_color: '#f6f3ee',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en-IN',
        categories: ['business', 'finance'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        mode: 'development',
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,ico,woff2}'],
      },
    }),
  ],
  preview: {
    headers: {
      'Cache-Control': 'no-store',
    },
  },
})
