import { memo } from "react"
import GraphicsElement from "./GraphicsElement"
import useGraphicTransition from "../hooks/useGraphicTransition"
import { GraphicsTransition, SpritePos } from "@tsukiweb-common/types"

type SpriteGraphicsProps = {
	pos: Exclude<SpritePos, 'bg'>
	image: string
	transition?: GraphicsTransition
}

//.......... l, c, r sprites ...........
const SpriteGraphics = ({pos, image, transition}: SpriteGraphicsProps)=> {
	const {
		img: currImg, prev: prevImg,
		duration: fadeTime, effect, onAnimationEnd
	} = useGraphicTransition(pos, image, transition)

	if (prevImg == undefined) // not loaded or no change
		return (
			<GraphicsElement
					key={currImg}
					pos={pos}
					image={currImg}
				/>
		)
	return <>
		<GraphicsElement
				key={prevImg}
				pos={pos}
				image={prevImg}
				fadeOut={effect}
				fadeTime={fadeTime}
				toImg={currImg}
				onAnimationEnd={onAnimationEnd}
			/>
		<GraphicsElement
				key={currImg}
				pos={pos}
				image={currImg}
				fadeIn={effect}
				fadeTime={fadeTime}
				onAnimationEnd={onAnimationEnd}
			/>
	</>
}

export default memo(SpriteGraphics)