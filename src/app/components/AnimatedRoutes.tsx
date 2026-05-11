import { Switch, Route, Redirect, useLocation } from "wouter";
import { AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import '@tsukiweb-common/styles/main.scss'
import '../styles/App.scss'
import '@tsukiweb-common/graphics/styles/graphics.scss'
import ExtraLayout from "features/title-menu/components/ExtraLayout";
import { useCallback, useState } from "react";
import { Particles } from "@tsukiweb-common/ui-core";
import ConfigScreen from "app/screens/ConfigScreen";
import DisclaimerScreen from "app/screens/DisclaimerScreen";
import EndingsScreen from "app/screens/EndingsScreen";
import FlowchartScreen from "app/screens/FlowchartScreen";
import GalleryScreen from "app/screens/GalleryScreen";
import LoadScreen from "app/screens/LoadScreen";
import PlusDiscScreen from "app/screens/PlusDiscScreen";
import SceneReplayScreen from "app/screens/SceneReplayScreen";
import TitleMenuScreen from "app/screens/TitleMenuScreen";
import Window from "app/screens/Window";
import { SCREEN } from "app/utils/display";

const AnimatedRoutes = () => {
	const [location] = useLocation()
	const pathname = location.split('?')[0]
	
	// Show disclaimer only if: first page of session was "/" AND disclaimer not yet seen this session
	const [showDisclaimer, setShowDisclaimer] = useState(() => {
		const entryPath = sessionStorage.getItem('tsuki_entry_path')
		const disclaimerSeen = sessionStorage.getItem('tsuki_disclaimer_seen')
		return entryPath === '/' && !disclaimerSeen
	})

	const markDisclaimerAsSeen = useCallback(() => {
		sessionStorage.setItem('tsuki_disclaimer_seen', 'true')
		setShowDisclaimer(false)
	}, [])

	const isExtra = [SCREEN.GALLERY, SCREEN.ENDINGS, SCREEN.SCENES, SCREEN.PLUS_DISC].some(path =>
		pathname.startsWith(path)
	)
	const keyPresence = isExtra ? "extra" : pathname
	const showParticles = pathname !== "/window"
	const titleKey = showDisclaimer ? "title-behind-disclaimer" : "title"

	return (
		<LazyMotion features={domAnimation} strict>
			{showParticles && <Particles />}
			<AnimatePresence mode="wait">
				<Switch location={pathname} key={keyPresence}>
					<Route path="/">
						<TitleMenuScreen key={titleKey} />
					</Route>
					<Route path={SCREEN.LOAD}>
						<LoadScreen />
					</Route>
					<Route path={SCREEN.CONFIG}>
						<ConfigScreen />
					</Route>

					<Route path={SCREEN.GALLERY}>
						<ExtraLayout><GalleryScreen /></ExtraLayout>
					</Route>
					<Route path={SCREEN.ENDINGS}>
						<ExtraLayout><EndingsScreen /></ExtraLayout>
					</Route>
					<Route path={`${SCREEN.SCENES}/:sceneId`}>
						<ExtraLayout><SceneReplayScreen /></ExtraLayout>
					</Route>
					<Route path={SCREEN.SCENES}>
						<ExtraLayout><FlowchartScreen /></ExtraLayout>
					</Route>
					<Route path={SCREEN.PLUS_DISC}>
						<ExtraLayout><PlusDiscScreen /></ExtraLayout>
					</Route>

					<Route path={SCREEN.WINDOW}>
						<Window />
					</Route>

					<Route>
						<Redirect to="/" />
					</Route>
				</Switch>
			</AnimatePresence>
			<AnimatePresence>
				{showDisclaimer && <DisclaimerScreen onAccept={markDisclaimerAsSeen} />}
			</AnimatePresence>
		</LazyMotion>
	)
}

export default AnimatedRoutes