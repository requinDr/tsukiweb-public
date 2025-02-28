import ReactDOM from 'react-dom/client'
import App from './App'
import { StrictMode } from 'react'
import { mountModalManager } from '@tsukiweb-common/ui-core/components/ModalPrompt';

mountModalManager()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)

postMessage({ payload: 'removeLoading' }, '*')
