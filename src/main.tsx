import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './core/styles/index.css'
import { installUpdateCheck } from './core/lib/pwa'
import App from './App.tsx'
import { validateRegistry } from './core/modules/registry-utils'
import { MODULES } from './modules/registry'
import { reloadOnce } from './core/lib/chunk-reload'

// A misconfigured module fails loudly here rather than as a dead route.
validateRegistry(MODULES)
installUpdateCheck()

// Vite's own signal that a preloaded chunk from an older build is gone; see
// core/lib/chunk-reload.ts.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnce()) event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
