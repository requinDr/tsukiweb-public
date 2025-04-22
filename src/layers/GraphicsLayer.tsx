import { memo, useCallback } from "react";
import { gameContext } from "utils/gameContext";
import { SCREEN, displayMode } from "../utils/display";
import SpriteGraphics from "../components/molecules/SpriteGraphics";
import BackgroundGraphics from "../components/molecules/BackgroundGraphics";
import ForegroundGraphics from "../components/molecules/ForegroundGraphics";
import { observe, useObserved } from "@tsukiweb-common/utils/Observer";
import { resetTransition, resetQuake, quakeEffect, transition } from "@tsukiweb-common/utils/graphics";
import classNames from "classnames";

observe(displayMode, 'screen', (screen)=> {
	if (screen != SCREEN.WINDOW) {
		resetTransition()
		resetQuake()
	}
})

const GraphicsLayer = memo(function({...props}: Record<string, any>) {

	const [quake] = useObserved(quakeEffect, 'duration', (d)=>d!=0)
	const [monoChrome] = useObserved(gameContext.graphics, 'monochrome')

//........ animation callbacks .........
	const onQuakeEnd = useCallback(()=> {
		quakeEffect.duration = 0
	}, [])

//......... compute properties .........
	let style
	({style, ...props} = props)
	style = { ...style }
	
	if (quake) {
		style['--quake-x'] = `${quakeEffect.x}pt`
		style['--quake-y'] = `${quakeEffect.y}pt`
		style['--quake-time'] = `${quakeEffect.duration}ms`
	}
	if (monoChrome) {
		style['--monochrome-color'] = monoChrome
	}

	return (
		<div id="layer-graphics"
			{...props}
			className={classNames("layer", "graphics", {quake, monochrome: monoChrome}, props.className)}
			style={style}
			onAnimationEnd={onQuakeEnd}
		>
			<BackgroundGraphics />
			<SpriteGraphics pos='l'/>
			<SpriteGraphics pos='c'/>
			<SpriteGraphics pos='r'/>
			<ForegroundGraphics />
		</div>
	)
})

export default GraphicsLayer

//##############################################################################
//#                                   DEBUG                                    #
//##############################################################################

window.transition = transition
