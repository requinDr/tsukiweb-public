import { memo } from "react"
import { displayMode } from "../../utils/display"
import GraphicsElement from "./GraphicsElement"
import { useObserved } from "@tsukiweb-common/utils/Observer"
import { GraphicsTransition } from "@tsukiweb-common/types"
import useGraphicTransition from "hooks/useGraphicTransition"

type Props = {
	image: string
	transition: GraphicsTransition|undefined
}
/**
 * used to make background transitions over the sprites
 */
const ForegroundGraphics = ({image, transition}: Props) => {
	const [bgAlign] = useObserved(displayMode, 'bgAlignment')
	const {
		img: currImg, prev: prevImg,
		duration: fadeTime, effect, onAnimationEnd
	} = useGraphicTransition('bg', image, transition)

	if (prevImg === undefined) return null

	return (
		<GraphicsElement key={currImg}
			pos='bg'
			image={currImg}
			fadeTime={fadeTime}
			fadeIn={effect}
			onAnimationEnd={onAnimationEnd}
			bg-align={bgAlign}
		/>
	)
}

export default memo(ForegroundGraphics)