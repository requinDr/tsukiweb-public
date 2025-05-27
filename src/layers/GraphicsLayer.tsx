import { memo, useEffect, useRef, useState, CSSProperties, useMemo } from "react";
import SpriteGraphics from "../components/molecules/SpriteGraphics";
import BackgroundGraphics from "../components/molecules/BackgroundGraphics";
import ForegroundGraphics from "../components/molecules/ForegroundGraphics";
import { useObserved } from "@tsukiweb-common/utils/Observer";
import classNames from "classnames";
import { ScriptPlayer } from "script/ScriptPlayer";
import { DivProps, GraphicsTransition, SpritePos } from "@tsukiweb-common/types";
import { objectMatch, objectsEqual, splitFirst } from "@tsukiweb-common/utils/utils";
import { imagePath, isImgUnlocked } from "utils/gallery";
import { settings } from "utils/settings";
import { wordImage } from "translation/assets";
import { useTraceUpdate } from "@tsukiweb-common/hooks/useTraceUpdate";

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
		const [dir, name] = image.split('/')
		
		// Save to gallery if it's a new image
		if (imagePath(name) == image && !isImgUnlocked(image)) {
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
	let pos = 'bg', image = '', effect = '', time = ''
	switch (cmd) {
		case 'bg' : [image, effect, time] = arg.split(/,(?!.*`)/); break; // ignore commas inside image
		case 'ld' : [pos, image, effect, time] = arg.split(','); break;
		case 'cl' : [pos, effect, time] = arg.split(','); break;
		default : throw Error(`unknown image command ${cmd} ${arg}`)
	}
	const _onFinish = ()=> {
		if (pos == 'a')
			script.graphics = {l: "", c: "", r: ""}
		else if (pos == 'bg') {
			script.graphics = {bg: image, l: "", c: "", r: ""}
		} else {
			script.graphics[pos as SpritePos] = image
		}
		setTransition(undefined)
		onTransitionEnd?.()
		onFinish()
	}

	// get image
	if (image)
		image = extractImage(image)
	const to = (pos == 'a') ? {l: "", c: "", r: ""} : {[pos]: image}
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
		default : throw Error(`Unknwon quake command ${cmd} ${arg}`)
	}
	onTransitionStart?.()
	return { next: _onFinish }
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
	const style = useRef<CSSProperties>(undefined)
	const otherProps = useRef<Omit<DivProps, 'style'>>(undefined)
	//useTraceUpdate("[GRAPHICS]", {script, quake, transition, monoChrome})
//......... register commands ..........
	useEffect(()=> {
		const _processImageCmd = processImageCmd.bind(null, onTransitionStart,
				onTransitionEnd, setTransition)
		const _processQuake = processQuake.bind(null, onTransitionStart,
				onTransitionEnd, setQuake)
		script.setCommands({
			'bg' : _processImageCmd,
			'ld' : _processImageCmd,
			'cl' : _processImageCmd,
			'quakex'  : _processQuake,
			'quakey'  : _processQuake,
			'monocro' : processMonocro, //TODO : crossfade ?
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
			<SpriteGraphics image={graphics.l} transition={transition} pos='l'/>
			<SpriteGraphics image={graphics.c} transition={transition} pos='c'/>
			<SpriteGraphics image={graphics.r} transition={transition} pos='r'/>
			<ForegroundGraphics image={graphics.bg} transition={transition} />
		</div>
	)
})

export default GraphicsLayer
