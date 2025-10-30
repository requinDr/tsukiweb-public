import { objectMatch, splitFirst } from "@tsukiweb-common/utils/utils";
import { displayMode } from "./display";
import { settings } from "./settings";
import cg from "./gallery";
import { wordImage } from "translation/assets";
import { GraphicsTransition, Quake, RocketProps, SpritePos } from "@tsukiweb-common/types";
import { ScriptPlayer } from "script/ScriptPlayer";

const POSITIONS = ["top", "center", "bottom"]

/**
 * Move background up or down
 */
export function moveBg(direction: "up"|"down") {
	let index = POSITIONS.indexOf(displayMode.bgAlignment)
	if (direction == "down" && index < 2) index++
	else if(direction == "up" && index > 0) index--
	displayMode.bgAlignment = POSITIONS[index]
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

export function processImageCmd(onTransitionStart: VoidFunction|undefined,
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


export function processQuake(onTransitionStart: VoidFunction|undefined,
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

export function processRocket(
	setRocket: (rocket: RocketProps | undefined) => void,
	arg: string,
	cmd: string,
	script: ScriptPlayer,
	onFinish: VoidFunction
) {
	const params: Record<string, string> = {}
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
	const wait = (!Object.hasOwn(params, "wait") || params.wait == "true")

	const onAnimationEnd = () => {
		if (wait) {
			setRocket(undefined);
			onFinish()
		}
	}

	const rocket: RocketProps = {
		layer: layer,
		my: parseFloat(params.my || '0'),
		magnify: parseFloat(params.magnify || '1'),
		time: parseInt(params.time || '0'),
		accel: parseInt(params.accel || '1'),
		opacity: parseInt(params.opacity || '255'),
		onAnimationEnd
	}

	setRocket(rocket)
	if (wait)
		return { next: onAnimationEnd }
}

export function processMonocro(color: string, _: string, script: ScriptPlayer) {
	if (color == "off")
		color = ""
	script.graphics.monochrome = color
}