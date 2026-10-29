import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './core/styles/index.css'
import { installUpdateCheck } from './core/lib/pwa'
import App from './App.tsx'
import { validateRegistry } from './core/modules/registry-utils'
import { MODULES } from './modules/registry'

// A misconfigured module fails loudly here rather than as a dead route.
validateRegistry(MODULES)
installUpdateCheck()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
