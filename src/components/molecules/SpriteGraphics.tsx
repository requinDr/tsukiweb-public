import { memo } from "react"
import GraphicsElement from "./GraphicsElement"
import { SpritePos } from "./GraphicsGroup"
import useGraphicTransition from "../hooks/useGraphicTransition"
import { endTransition } from "../../utils/graphics"

type SpriteGraphicsProps = {
	pos: Exclude<SpritePos, 'bg'>
}

//.......... l, c, r sprites ...........
const SpriteGraphics = ({pos}: SpriteGraphicsProps)=> {
	const {img: currImg, prev: prevImg, duration: fadeTime, effect, imgLoaded}
			= useGraphicTransition(pos)

	if (!imgLoaded || prevImg == currImg)
		return <GraphicsElement key={prevImg} pos={pos} image={prevImg}/>

	return <>
		{fadeTime > 0 &&
			<GraphicsElement
				key={prevImg}
				pos={pos}
				image={prevImg}
				fadeOut={effect}
				fadeTime={fadeTime}
				toImg={currImg}
				onAnimationEnd={endTransition}/>
		}
		{(fadeTime == 0 || effect != "") &&
			<GraphicsElement
				key={currImg}
				pos={pos}
				image={currImg}
				fadeIn={effect}
				fadeTime={fadeTime}
				onAnimationEnd={endTransition}/>
		}
	</>
}

export default memo(SpriteGraphics)