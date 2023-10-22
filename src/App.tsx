import { BrowserRouter } from "react-router-dom";
import AnimatedRoutes from './AnimatedRoutes';
import { StrictMode } from 'react';

function App() {

  return (
    <StrictMode>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AnimatedRoutes />
      </BrowserRouter>
    </StrictMode>
  )
}

export default App
