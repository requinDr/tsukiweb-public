import { useLayoutEffect } from "react"
import { useNavigate } from "react-router"
import { observe, unobserve } from "@tsukiweb-common/utils/Observer"
import { displayMode, SCREEN } from "utils/display"

/**
 * Navigate to the correct screen when setting the `displayMode.screen` value.
 * 
 * Calling this method also sets this attribute to the provided `currentScreen`.
 * @param currentScreen label of the current screen this hook is used on
 */
export function useScreenAutoNavigate(currentScreen: SCREEN) {
	const navigate = useNavigate()

	useLayoutEffect(()=> {
		if (displayMode.screen !== currentScreen) {
			displayMode.screen = currentScreen
		}
		const handleNavigate = (screen: SCREEN) => {
			navigate(screen, { replace: false })
		}
		observe(displayMode, 'screen', handleNavigate, {
			filter: (s) => s != currentScreen
		})
		
		return () => {
			unobserve(displayMode, 'screen', handleNavigate)
		}
	}, [currentScreen, navigate])
}