import { Capacitor } from '@capacitor/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import '@fontsource/outfit/latin-400.css'
import '@fontsource/outfit/latin-500.css'
import '@fontsource/outfit/latin-600.css'
import '@fontsource/outfit/latin-700.css'
import '@fontsource/outfit/latin-ext-400.css'
import '@fontsource/outfit/latin-ext-500.css'
import '@fontsource/outfit/latin-ext-600.css'
import '@fontsource/outfit/latin-ext-700.css'
import '@fontsource-variable/fraunces/opsz.css'
import './index.css'

const nativeBundle = import.meta.env.VITE_CAPACITOR === '1'
if (
  import.meta.env.PROD &&
  !nativeBundle &&
  !Capacitor.isNativePlatform() &&
  window.isSecureContext &&
  'serviceWorker' in navigator
) {
  registerSW({ immediate: true })
}

const root = document.getElementById('root')
if (!root) throw new Error('Root missing')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
