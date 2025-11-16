import { Routes, Route, Navigate, useLocation, Outlet } from "react-router";
import { AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import Window from './screens/Window'
import TitleMenuScreen from './screens/TitleMenuScreen';
import GalleryScreen from './screens/GalleryScreen';
import ConfigScreen from './screens/ConfigScreen';
import LoadScreen from "./screens/LoadScreen";
import DisclaimerScreen from "./screens/DisclaimerScreen";
import '@tsukiweb-common/styles/main.scss'
import '@styles/App.scss'
import '@styles/graphics.scss'
import EndingsScreen from "./screens/EndingsScreen";
import FlowchartScreen from "./screens/FlowchartScreen";
import SceneReplayScreen from "screens/SceneReplayScreen";
import ExtraLayout from "layouts/ExtraLayout";
import PlusDiscScreen from "screens/PlusDiscScreen";
import { useCallback, useEffect, useRef, useState } from "react";
import { Particles } from "@tsukiweb-common/ui-core";
import CharactersScreen from "screens/CharactersScreen";
import { SCREEN } from "utils/display";

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

	const isExtra = [SCREEN.GALLERY, SCREEN.ENDINGS, SCREEN.SCENES, SCREEN.CHARACTERS, SCREEN.PLUS_DISC].some(path =>
		location.pathname.startsWith(path)
	)
	const keyPresence = isExtra ? "extra" : location.pathname
	const showParticles = location.pathname !== "/disclaimer" && location.pathname !== "/window";

	return (
		<LazyMotion features={domAnimation} strict>
			{showParticles && <Particles />}
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
					<Route path={SCREEN.LOAD} element={<LoadScreen />} />
					<Route path={SCREEN.CONFIG} element={<ConfigScreen />} />

					<Route element={<ExtraLayout><Outlet /></ExtraLayout>}>
						<Route path={SCREEN.GALLERY} element={<GalleryScreen />} />
						<Route path={SCREEN.ENDINGS} element={<EndingsScreen />} />
						<Route path={SCREEN.SCENES}>
							<Route index element={<FlowchartScreen />} />
							<Route path=":sceneId" element={<SceneReplayScreen />} />
						</Route>
						<Route path={SCREEN.CHARACTERS} element={<CharactersScreen />} />
						<Route path={SCREEN.PLUS_DISC} element={<PlusDiscScreen />} />
					</Route>

					<Route path={SCREEN.WINDOW} element={<Window />} />

					<Route path="*" element={<Navigate to="/disclaimer" />} />
				</Routes>
			</AnimatePresence>
		</LazyMotion>
	)
}

export default AnimatedRoutes