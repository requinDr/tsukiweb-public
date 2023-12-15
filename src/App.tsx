import { BrowserRouter } from "react-router-dom";
import AnimatedRoutes from './AnimatedRoutes';
import { useObserved } from "./utils/Observer";
import strings from "./utils/lang";
import { ErrorBoundary } from "react-error-boundary";
import PageCrash from "./screens/CrashScreen";

function App() {
  const [locale] = useObserved(strings, 'locale')
  document.documentElement.setAttribute('lang', locale)

  return (
    <ErrorBoundary FallbackComponent={PageCrash}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AnimatedRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
