import { memo, useEffect, useState, CSSProperties } from "react";
import { useObserved } from "@tsukiweb-common/utils/Observer";
import classNames from "classnames";
import { ScriptPlayer } from "script/ScriptPlayer";
import { processImageCmd, processMonocro, processQuake, processRocket } from "utils/graphics";
import { displayMode } from "utils/display";
import { Quake, GraphicsTransition, Rocket, BackgroundGraphics, ForegroundGraphics, SpriteGraphics, SPRITES_POSITIONS } from "@tsukiweb-common/graphics";

type Props = {
	script: ScriptPlayer
}
const GraphicsLayer = ({ script }: Props) => {
	const [bgAlign] = useObserved(displayMode, 'bgAlignment')
	const [bgMoveTime] = useObserved(displayMode, 'bgMoveTime')
	const [quake, setQuake] = useState<Quake|undefined>(undefined)
	const [transition, setTransition] = useState<GraphicsTransition|undefined>(undefined)
	const [monochrome] = useObserved(script.graphics, 'monochrome')
	const [rocket, setRocket] = useState<Rocket|undefined>(undefined)
	const [topSprite, setTopSprite] = useState<'l'|'c'|'r'|undefined>(undefined)
	
	useEffect(()=> {
		const img = processImageCmd.bind(null, setTransition)
		const qk = processQuake.bind(null, setQuake)
		
		script.setCommands({
			bg: img, ld: img, cl: img,
			quakex: qk, quakey: qk, quakexy: qk,
			monocro: processMonocro,
			rocket: processRocket.bind(null, setRocket),
		})
	}, [script])

	const style = {
		...(bgMoveTime > 0 && { '--bg-move-duration': `${bgMoveTime}ms` }),
		...(quake && {
			'--quake-x': `${quake.x}pt`,
			'--quake-y': `${quake.y}pt`,
			'--quake-time': `${quake.duration}ms`,
		}),
		...(monochrome && { '--monochrome-color': monochrome })
	} as CSSProperties

	useEffect(()=> {
		if (!transition)
			return

		const appearingSprite = SPRITES_POSITIONS.find(layer => {
			const nextImage = transition.to[layer]
			return typeof nextImage == 'string' && nextImage.length > 0
		})

		if (appearingSprite)
			setTopSprite(appearingSprite)
	}, [transition])

	const { graphics } = script

	return (
		<div id="layer-graphics"
			className={classNames("layer", "graphics", {quake, monochrome})}
			style={style}
			onAnimationEnd={quake?.onFinish}
		>
			<BackgroundGraphics image={graphics.bg} bgAlign={bgAlign} />
			<SpriteGraphics
				image={graphics.l}
				transition={transition}
				pos='l'
				rocket={rocket?.layer === 'l' ? rocket : undefined}
				topLayer={topSprite === 'l'}
			/>
			<SpriteGraphics
				image={graphics.c}
				transition={transition}
				pos='c'
				rocket={rocket?.layer === 'c' ? rocket : undefined}
				topLayer={topSprite === 'c'}
			/>
			<SpriteGraphics
				image={graphics.r}
				transition={transition}
				pos='r'
				rocket={rocket?.layer === 'r' ? rocket : undefined}
				topLayer={topSprite === 'r'}
			/>
			<ForegroundGraphics image={graphics.bg} transition={transition} bgAlign={bgAlign} />
		</div>
	)
}

export default memo(GraphicsLayer)
