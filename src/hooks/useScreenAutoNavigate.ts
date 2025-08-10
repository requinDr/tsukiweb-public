import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
	useEffect(()=> {
		displayMode.screen = currentScreen
		observe(displayMode, 'screen', navigate,
				{ filter: (s)=> s != currentScreen })
		return unobserve.bind(null, displayMode, 'screen', navigate) as VoidFunction
	}, [])
}