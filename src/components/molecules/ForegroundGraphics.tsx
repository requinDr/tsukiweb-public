import { memo } from "react"
import { useObserved } from "../../utils/Observer"
import { displayMode } from "../../utils/display"
import { endTransition } from "../../utils/graphics"
import useGraphicTransition from "../hooks/useGraphicTransition"
import GraphicsElement from "./GraphicsElement"

/**
 * used to make background transitions over the sprites
 */
const ForegroundGraphics = () => {
	const [bgAlign] = useObserved(displayMode, 'bgAlignment')
	const {img, duration, effect, imgLoaded} = useGraphicTransition('bg')

	if (!(imgLoaded && duration > 0 && effect != "")) return <></>

	return (
		<GraphicsElement key={img}
			pos='bg'
			image={img}
			fadeTime={duration}
			fadeIn={effect}
			onAnimationEnd={endTransition} {...{'bg-align': bgAlign}}/>
	)
}

export default memo(ForegroundGraphics)