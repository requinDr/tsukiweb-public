import { createRoot } from 'react-dom/client'
import App from './App'
import { StrictMode } from 'react'
import { mountDialogManager } from '@tsukiweb-common/ui-core/components/ModalPrompt'
import { importGameDataFromFile } from './utils/pwa-file-handler'
import { initFileHandling, registerFileHandler } from '@tsukiweb-common/utils/pwa-file-handlers'
import { FULLSAVE_EXT } from './utils/constants'

mountDialogManager()

//PWA File Handling
registerFileHandler(FULLSAVE_EXT, importGameDataFromFile)
initFileHandling()

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)