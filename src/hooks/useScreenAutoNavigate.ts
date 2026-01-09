import { useLayoutEffect } from "react"
import { useLocation } from "wouter"
import { observe, unobserve } from "@tsukiweb-common/utils/Observer"
import { displayMode, SCREEN } from "utils/display"

/**
 * Navigate to the correct screen when setting the `displayMode.screen` value.
 * 
 * Calling this method also sets this attribute to the provided `currentScreen`.
 * @param currentScreen label of the current screen this hook is used on
 */
export function useScreenAutoNavigate(currentScreen: SCREEN) {
	const [, setLocation] = useLocation()

	useLayoutEffect(()=> {
		if (displayMode.screen !== currentScreen) {
			displayMode.screen = currentScreen
		}
		const handleNavigate = (screen: SCREEN) => {
			setLocation(screen)
		}
		observe(displayMode, 'screen', handleNavigate, {
			filter: (s) => s != currentScreen
		})
		
		return () => {
			unobserve(displayMode, 'screen', handleNavigate)
		}
	}, [currentScreen, setLocation])
}