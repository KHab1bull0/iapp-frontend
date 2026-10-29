import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './core/styles/index.css'
import { installUpdateCheck } from './core/lib/pwa'
import App from './App.tsx'

installUpdateCheck()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
