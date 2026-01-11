import { createRoot } from 'react-dom/client'
import App from './App'
import { StrictMode } from 'react'
import { mountDialogManager } from '@tsukiweb-common/ui-core/components/ModalPrompt';

mountDialogManager()

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)