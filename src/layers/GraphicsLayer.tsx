import { memo, useEffect, useRef, useState, CSSProperties, useMemo } from "react";
import SpriteGraphics from "../components/molecules/SpriteGraphics";
import BackgroundGraphics from "../components/molecules/BackgroundGraphics";
import ForegroundGraphics from "../components/molecules/ForegroundGraphics";
import { useObserved } from "@tsukiweb-common/utils/Observer";
import classNames from "classnames";
import { ScriptPlayer } from "script/ScriptPlayer";
import { DivProps, GraphicsTransition, Quake, RocketProps } from "@tsukiweb-common/types";
import { processImageCmd, processMonocro, processQuake, processRocket } from "utils/graphics";


type Props = {
	script: ScriptPlayer
	onTransitionStart?: VoidFunction
	onTransitionEnd?: VoidFunction
} & DivProps

const GraphicsLayer = memo(function({
		script,
		onTransitionStart,
		onTransitionEnd,
		...props }: Props) {

	const [quake, setQuake] = useState<Quake|undefined>(undefined)
	const [transition, setTransition] = useState<GraphicsTransition|undefined>(undefined)
	const [monoChrome] = useObserved(script.graphics, 'monochrome')
	const [rocket, setRocket] = useState<RocketProps|undefined>(undefined)
	const style = useRef<CSSProperties>(undefined)
	const otherProps = useRef<Omit<DivProps, 'style'>>(undefined)
	//useTraceUpdate("[GRAPHICS]", {script, quake, transition, monoChrome})
//......... register commands ..........
	useEffect(()=> {
		const _processImageCmd = processImageCmd.bind(null, onTransitionStart,
				onTransitionEnd, setTransition)
		const _processQuake = processQuake.bind(null, onTransitionStart,
				onTransitionEnd, setQuake)
		const _processRocket = processRocket.bind(null, setRocket)
		script.setCommands({
			'bg' : _processImageCmd,
			'ld' : _processImageCmd,
			'cl' : _processImageCmd,
			'quakex'  : _processQuake,
			'quakey'  : _processQuake,
			'quakexy' : _processQuake,
			'monocro' : processMonocro, //TODO : crossfade ?
			'rocket' : _processRocket,
		})
	}, [script, onTransitionStart, onTransitionEnd])

//......... compute properties .........
	useMemo(()=> {
		const {style: _style, ..._props} = props
		style.current = {
			...(_style),
			...(quake && {
				'--quake-x': `${quake.x}pt`,
				'--quake-y': `${quake.y}pt`,
				'--quake-time': `${quake.duration}ms`,
			}),
			...(monoChrome && {
				'--monochrome-color': monoChrome
			})
		}
		otherProps.current = _props
	}, [props, quake, monoChrome])

	const graphics = script.graphics

	return (
		<div id="layer-graphics"
			{...otherProps.current}
			className={classNames("layer", "graphics", {quake, monochrome: monoChrome}, props.className)}
			style={style.current}
			onAnimationEnd={quake?.onFinish}
		>
			<BackgroundGraphics image={graphics.bg}/>
			<SpriteGraphics
				image={graphics.l}
				transition={transition}
				pos='l'
				rocket={rocket?.layer === 'l' ? rocket : undefined}
			/>
			<SpriteGraphics
				image={graphics.c}
				transition={transition}
				pos='c'
				rocket={rocket?.layer === 'c' ? rocket : undefined}
			/>
			<SpriteGraphics
				image={graphics.r}
				transition={transition}
				pos='r'
				rocket={rocket?.layer === 'r' ? rocket : undefined}
			/>
			<ForegroundGraphics image={graphics.bg} transition={transition} />
		</div>
	)
})

export default GraphicsLayer
