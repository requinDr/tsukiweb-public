import { memo } from "react"
import GraphicsElement from "./GraphicsElement"
import { GraphicsTransition, RocketProps, SpritePos } from "@tsukiweb-common/types"
import useGraphicTransition from "hooks/useGraphicTransition"

type SpriteGraphicsProps = {
	pos: Exclude<SpritePos, 'bg'>
	image: string
	transition?: GraphicsTransition
	rocket?: RocketProps
}

//.......... l, c, r sprites ...........
const SpriteGraphics = ({pos, image, transition, rocket}: SpriteGraphicsProps)=> {
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
				rocket={rocket}
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
			rocket={rocket}
		/>
	</>
}

export default memo(SpriteGraphics)