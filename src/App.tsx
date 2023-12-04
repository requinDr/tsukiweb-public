import { BrowserRouter } from "react-router-dom";
import AnimatedRoutes from './AnimatedRoutes';

function App() {
  const [locale] = useObserved(strings, 'locale')
  document.documentElement.setAttribute('lang', locale)

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App
