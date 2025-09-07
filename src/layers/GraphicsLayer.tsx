import { memo, useEffect, useRef, useState, CSSProperties, useMemo } from "react";
import SpriteGraphics from "../components/molecules/SpriteGraphics";
import BackgroundGraphics from "../components/molecules/BackgroundGraphics";
import ForegroundGraphics from "../components/molecules/ForegroundGraphics";
import { useObserved } from "@tsukiweb-common/utils/Observer";
import classNames from "classnames";
import { ScriptPlayer } from "script/ScriptPlayer";
import { DivProps, GraphicsTransition, RocketProps, SpritePos } from "@tsukiweb-common/types";
import { objectMatch, splitFirst } from "@tsukiweb-common/utils/utils";
import { settings } from "utils/settings";
import { wordImage } from "translation/assets";
import cg from "utils/gallery";
import { displayMode } from "utils/display";

type Quake = {
	duration: number
	x: number
	y: number
	onFinish: VoidFunction
}

export function extractImage(image: string) {
	let text;
	[image, text] = splitFirst(image, '$')
	if (image.startsWith('"') && image.endsWith('"')) {
		image = image.substring(1, image.length-1)
		const [dir, name] = image.split('/')
		
		// Save to gallery if it's a new image
		if (cg.isInGallery(image) && !cg.isUnlocked(image)) {
			settings.eventImages.push(image)
		}

		if (dir == "word") {
			if (text)
				throw Error(`Cannot cumulate word image and text (${image}, ${text})`);
			[image, text] = splitFirst(wordImage(image), '$')
		}
	} else if (!image.startsWith('#')) { // not image nor color
		throw Error(`cannot extract image from "${image}"`)
	}
	return text ? `${image}$${text}` : image
}

//##############################################################################
//#region                       COMMAND HANDLERS
//##############################################################################

function processImageCmd(onTransitionStart: VoidFunction|undefined,
						 onTransitionEnd: VoidFunction|undefined,
						 setTransition: (t: GraphicsTransition|undefined)=>void,
						 arg: string, cmd: string, script: ScriptPlayer,
						 onFinish: VoidFunction) {
	let pos = 'bg', image = '', effect = '', time = '', rest: string[] = []
	switch (cmd) {
		case 'bg' : [image, effect, time, ...rest] = arg.split(/,(?!.*`)/); break; // ignore commas inside image
		case 'ld' : [pos, image, effect, time] = arg.split(','); break;
		case 'cl' : [pos, effect, time] = arg.split(','); break;
		default : throw Error(`unknown image command ${cmd} ${arg}`)
	}
	const positions = ['top', 'bottom', 'center']
	if (rest.length > 0 && positions.some(x=>rest.includes(x))) {
		const alignment = rest.find(x=>positions.includes(x)) || 'center'
		displayMode.bgAlignment = alignment
	}
	if (image)
		image = extractImage(image)
	const to = (pos == 'a') ? {l: "", c: "", r: ""} : {[pos]: image}
	const _onFinish = ()=> {
		if (!objectMatch(script.graphics, to)) {
			if (pos == 'a')
				script.graphics = {l: "", c: "", r: ""}
			else if (pos == 'bg') {
				script.graphics = {bg: image, l: "", c: "", r: ""}
			} else {
				script.graphics[pos as SpritePos] = image
			}
			setTransition(undefined)
			onTransitionEnd?.()
		}
		onFinish()
	}

	// get image
	if (!objectMatch(script.graphics, to)) {
		setTransition({
			to,
			effect,
			duration: +time,
			onFinish: _onFinish
		})
		onTransitionStart?.()
		return { next: _onFinish }
	} else {
		setTransition(undefined)
	}
}

function processQuake(onTransitionStart: VoidFunction|undefined,
						onTransitionEnd: VoidFunction|undefined,
						setQuake: (quake: Quake|undefined)=>void,
						arg: string, cmd: string, _script: ScriptPlayer,
						onFinish: VoidFunction) {
	const [ampl, duration] = arg.split(',').map(x=>parseInt(x))
	const _onFinish = ()=> {
		setQuake(undefined)
		onFinish()
		onTransitionEnd?.()
	}
	switch(cmd) {
		case 'quakex' :
			setQuake({duration, x: ampl, y: 0, onFinish: _onFinish})
			break
		case 'quakey' :
			setQuake({duration, x: 0, y: ampl, onFinish: _onFinish})
			break
		case 'quakexy' :
			setQuake({duration, x: ampl, y: ampl, onFinish: _onFinish})
			break
		default : throw Error(`Unknown quake command ${cmd} ${arg}`)
	}
	onTransitionStart?.()
	return { next: _onFinish }
}

function processRocket(
	setRocket: (rocket: RocketProps | undefined) => void,
	arg: string,
	cmd: string,
	script: ScriptPlayer,
	onFinish: VoidFunction
) {
	const params: any = {}
	const parts = arg.split(' ')
	for (const part of parts) {
		const [key, value] = part.split('=')
		params[key] = value
	}

	const layer = params.layer as RocketProps['layer']

	if (!['l', 'c', 'r'].includes(layer)) {
		console.error(`Invalid layer for @rocket: ${layer}`)
		onFinish()
		return
	}

	const onAnimationEnd = () => {
		setRocket(undefined);
		onFinish()
	}

	const rocket: RocketProps = {
		layer: layer,
		my: parseFloat(params.my || 0),
		magnify: parseFloat(params.magnify || 1),
		time: parseInt(params.time || 0),
		accel: parseInt(params.accel || 1),
		opacity: parseInt(params.opacity || 255),
		onAnimationEnd
	}

	setRocket(rocket)
	return { next: onAnimationEnd }
}

function processMonocro(color: string, _: string, script: ScriptPlayer) {
	if (color == "off")
		color = ""
	script.graphics.monochrome = color
}

//#endregion ###################################################################
//#region                           COMPONENT
//##############################################################################

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
			<SpriteGraphics image={graphics.l} transition={transition} pos='l' rocket={rocket?.layer === 'l' ? rocket : undefined}/>
			<SpriteGraphics image={graphics.c} transition={transition} pos='c' rocket={rocket?.layer === 'c' ? rocket : undefined}/>
			<SpriteGraphics image={graphics.r} transition={transition} pos='r' rocket={rocket?.layer === 'r' ? rocket : undefined}/>
			<ForegroundGraphics image={graphics.bg} transition={transition} />
		</div>
	)
})

export default GraphicsLayer
