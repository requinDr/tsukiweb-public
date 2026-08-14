import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@tsukiweb/common/styles/main.scss'
import '../app/styles/App.scss'
import './setup.scss'
import SetupApp from './SetupApp'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <SetupApp />
  </StrictMode>
)
