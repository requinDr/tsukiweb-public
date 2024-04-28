import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./assets/fonts/Ubuntu-Regular.ttf"
import "./assets/fonts/Ubuntu-Bold.ttf"
import { AnimatePresence } from 'framer-motion';
import Window from './screens/Window'
import TitleMenuScreen from './screens/TitleMenuScreen';
import GalleryScreen from './screens/GalleryScreen';
import ConfigScreen from './screens/ConfigScreen';
import LoadScreen from "./screens/LoadScreen";
import DisclaimerScreen from "./screens/DisclaimerScreen";
import { Slide, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.scss'
import EndingsScreen from "./screens/EndingsScreen";
import FlowchartScreen from "./screens/FlowchartScreen";
import AppLayout from "./layouts/AppLayout";
import SceneReplayScreen from "screens/SceneReplayScreen";


const AnimatedRoutes = () => {
  const location = useLocation()

  return (
    <AppLayout>
      <ToastContainer
        transition={Slide}
        position="bottom-right"
        autoClose={3000}
        closeButton={false}
        pauseOnFocusLoss={false}
        theme="dark" />
      
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/*" element={<Navigate to={"/disclaimer"} />} />
          <Route path="/disclaimer" element={<DisclaimerScreen />} />
          <Route path="/title" element={<TitleMenuScreen />} />
          <Route path="/window" element={<Window />} />
          <Route path="/load" element={<LoadScreen />} />
          <Route path="/config" element={<ConfigScreen />} />
          <Route path="/extra">
            <Route index element={<Navigate to=".." />} />
            <Route path="gallery" element={<GalleryScreen />} />
            <Route path="endings" element={<EndingsScreen />} />
            <Route path="scenes">
              <Route index element={<FlowchartScreen />} />
              <Route path=":sceneId" element={<SceneReplayScreen />} />
            </Route>
          </Route>
        </Routes>
      </AnimatePresence>
    </AppLayout>
  )
}

export default AnimatedRoutes