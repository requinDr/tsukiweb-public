import { memo } from "react"
import { useObserved } from "../../utils/Observer"
import { displayMode } from "../../utils/display"
import useGraphicTransition from "../hooks/useGraphicTransition"
import GraphicsElement from "./GraphicsElement"

const BackgroundGraphics = ()=> {
	const [bgAlign] = useObserved(displayMode, 'bgAlignment')
	const {img: currImg, prev: prevImg, duration: fadeTime, effect: _effect}
			= useGraphicTransition('bg', false)
	const bgTransition = fadeTime > 0

	const img = bgTransition ? prevImg : currImg
	return (
		<GraphicsElement key={img}
			pos='bg'
			image={img}
			{...{'bg-align': bgAlign}}/>
	)
}

export default memo(BackgroundGraphics)