import { createRoot } from 'react-dom/client'
import App from './components/App'
import { StrictMode } from 'react'
import { mountDialogManager } from '@tsukiweb/common/ui-core/components/ModalPrompt'
import { initFileHandling, registerFileHandler } from '@tsukiweb/common/utils/pwa-file-handlers'
import { importGameDataFromFile } from 'engine/pwa-file-handler';
import { FULLSAVE_EXT } from './utils/constants';
import { StringsProvider } from 'translation/lang'

mountDialogManager()

//PWA File Handling
registerFileHandler(FULLSAVE_EXT, importGameDataFromFile)
initFileHandling()

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <StringsProvider>
      <App />
    </StringsProvider>
  </StrictMode>
)