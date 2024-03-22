import { BrowserRouter } from "react-router-dom";
import AnimatedRoutes from './AnimatedRoutes';
import { useObserved } from "./utils/Observer";
import strings from "./utils/lang";
import { ErrorBoundary } from "react-error-boundary";
import PageCrash from "./screens/CrashScreen";

const LocaleSetter = () => {
  const [locale] = useObserved(strings, 'locale')
  document.documentElement.setAttribute('lang', locale)

  return null
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={PageCrash}>
      <LocaleSetter />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AnimatedRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
