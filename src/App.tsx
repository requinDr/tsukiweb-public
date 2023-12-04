import { BrowserRouter } from "react-router-dom";
import AnimatedRoutes from './AnimatedRoutes';

function App() {

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App
