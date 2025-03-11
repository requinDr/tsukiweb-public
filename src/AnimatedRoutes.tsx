import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import "@tsukiweb-common/assets/fonts/Ubuntu-Regular.ttf"
import "@tsukiweb-common/assets/fonts/Ubuntu-Bold.ttf"
import { AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import Window from './screens/Window'
import TitleMenuScreen from './screens/TitleMenuScreen';
import GalleryScreen from './screens/GalleryScreen';
import ConfigScreen from './screens/ConfigScreen';
import LoadScreen from "./screens/LoadScreen";
import DisclaimerScreen from "./screens/DisclaimerScreen";
import '@tsukiweb-common/styles/main.scss'
import './styles/App.scss'
import './styles/graphics.scss'
import EndingsScreen from "./screens/EndingsScreen";
import FlowchartScreen from "./screens/FlowchartScreen";
import SceneReplayScreen from "screens/SceneReplayScreen";
import ExtraLayout from "layouts/ExtraLayout";
import PlusDiscScreen from "screens/PlusDiscScreen";
import { useCallback, useEffect, useRef, useState } from "react";

const AnimatedRoutes = () => {
	const isFirstRender = useRef(true)
	const [hasSeenDisclaimer, setHasSeenDisclaimer] = useState(false)
	const location = useLocation()

	useEffect(() => {
		// If this is the first render and we're not at the root or disclaimer page,
		// mark disclaimer as seen to avoid redirecting
		if (isFirstRender.current && 
				location.pathname !== '/' && 
				location.pathname !== '/disclaimer') {
			setHasSeenDisclaimer(true)
		}
		isFirstRender.current = false
	}, [location.pathname])

	const markDisclaimerAsSeen = useCallback(() => {
		setHasSeenDisclaimer(true)
	}, [])

	const isExtra = ["/gallery", "/endings", "/scenes", "/plus-disc"].some(path =>
		location.pathname.startsWith(path)
	)
	const keyPresence = isExtra ? "extra" : location.pathname

	return (
		<LazyMotion features={domAnimation} strict>
			<AnimatePresence mode="wait">
				<Routes location={location} key={keyPresence}>
					<Route path="/disclaimer" element={<DisclaimerScreen onAccept={markDisclaimerAsSeen} />} />
					<Route 
						path="/" 
						element={
							!hasSeenDisclaimer 
								? <Navigate to="/disclaimer" replace /> 
								: <TitleMenuScreen />
						} 
					/>
					<Route path="/title" element={<Navigate to="/" replace />} />
					<Route path="/window" element={<Window />} />
					<Route path="/load" element={<LoadScreen />} />
					<Route path="/config" element={<ConfigScreen />} />

					<Route element={<ExtraLayout><Outlet /></ExtraLayout>}>
						<Route path="/gallery" element={<GalleryScreen />} />
						<Route path="/endings" element={<EndingsScreen />} />
						<Route path="/scenes">
							<Route index element={<FlowchartScreen />} />
							<Route path=":sceneId" element={<SceneReplayScreen />} />
						</Route>
						<Route path="/plus-disc" element={<PlusDiscScreen />} />
					</Route>
					
					<Route path="*" element={<Navigate to="/disclaimer" />} />
				</Routes>
			</AnimatePresence>
		</LazyMotion>
	)
}

export default AnimatedRoutes