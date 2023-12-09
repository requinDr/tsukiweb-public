import { BrowserRouter } from "react-router-dom";
import AnimatedRoutes from './AnimatedRoutes';
import { StrictMode } from 'react';
import { useObserved } from "./utils/Observer";
import strings from "./utils/lang";

function App() {
  const [locale] = useObserved(strings, 'locale')
  document.documentElement.setAttribute('lang', locale)

  return (
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AnimatedRoutes />
      </BrowserRouter>
    </StrictMode>
  )
}

export default App
