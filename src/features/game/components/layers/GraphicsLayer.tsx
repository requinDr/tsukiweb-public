import { memo, useEffect, useState, CSSProperties } from "react";
import { useObserved } from "@tsukiweb-common/utils/Observer";
import classNames from "classnames";
import { ScriptPlayer } from "engine/ScriptPlayer";
import { processImageCmd, processMonocro, processQuake, processRocket } from "features/game/utils/graphics";
import { Quake, GraphicsTransition, Rocket, BackgroundGraphics, ForegroundGraphics, SpriteGraphics, SPRITES_POSITIONS } from "@tsukiweb-common/graphics";
import { displayMode } from "app/utils/display";

type Props = {
	script: ScriptPlayer
}
const GraphicsLayer = ({ script }: Props) => {
	const [defaultBgAlign] = useObserved(displayMode, 'bgAlignment')
	const [bgMoveTime] = useObserved(displayMode, 'bgMoveTime')
	const [bgAlign, setBgAlign] = useState<string|undefined>(undefined)
	const [quake, setQuake] = useState<Quake|undefined>(undefined)
	const [transition, setTransition] = useState<GraphicsTransition|undefined>(undefined)
	const [monochrome] = useObserved(script.graphics, 'monochrome')
	const [rocket, setRocket] = useState<Rocket|undefined>(undefined)
	const [topSprite, setTopSprite] = useState<'l'|'c'|'r'|undefined>(undefined)
	
	useEffect(()=> {
		const img = processImageCmd.bind(null, setTransition, setRocket)
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

		if (transition.to.bgAlign) {
			setBgAlign(transition.to.bgAlign)
		} else {
			setBgAlign(defaultBgAlign)
		}
	}, [transition, defaultBgAlign])

	const { graphics } = script

	return (
		<div id="layer-graphics"
			className={classNames("layer", "graphics", {quake, monochrome})}
			style={style}
			onAnimationEnd={quake?.onFinish}
		>
			<BackgroundGraphics
				image={useObserved(graphics, 'bg')[0]}
				bgAlign={transition?.to.bg == graphics.bg ? bgAlign : defaultBgAlign}
			/>
			<SpriteGraphics
				image={useObserved(graphics, 'l')[0]}
				transition={transition}
				pos='l'
				rocket={rocket?.layer === 'l' ? rocket : undefined}
				topLayer={topSprite === 'l'}
			/>
			<SpriteGraphics
				image={useObserved(graphics, 'c')[0]}
				transition={transition}
				pos='c'
				rocket={rocket?.layer === 'c' ? rocket : undefined}
				topLayer={topSprite === 'c'}
			/>
			<SpriteGraphics
				image={useObserved(graphics, 'r')[0]}
				transition={transition}
				pos='r'
				rocket={rocket?.layer === 'r' ? rocket : undefined}
				topLayer={topSprite === 'r'}
			/>
			<ForegroundGraphics
				image={graphics.bg}
				transition={transition}
				bgAlign={bgAlign}
			/>
		</div>
	)
}

export default memo(GraphicsLayer)
