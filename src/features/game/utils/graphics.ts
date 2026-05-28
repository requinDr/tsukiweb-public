import { objectMatch, splitFirst } from "@tsukiweb-common/utils/utils";
import { settings } from "../../../engine/settings";
import { imageSrc, wordImage } from "translation/assets";
import { BG_POSITIONS, Graphics, GraphicsTransition, Quake, Rocket, SpritePos, SPRITES_POSITIONS } from "@tsukiweb-common/graphics";
import { ScriptPlayer } from "engine/ScriptPlayer";
import Timer from "@tsukiweb-common/utils/timer";
import cg from "features/gallery/utils/gallery";
import { displayMode } from "app/utils/display";
import { isImage, preloadImage } from "@tsukiweb-common/utils/images";


/**
 * Move background up or down
 */
export function moveBg(direction: "up"|"down") {
	let index = BG_POSITIONS.indexOf(displayMode.bgAlignment)
	if (direction == "down" && index < 2) index++
	else if(direction == "up" && index > 0) index--

	displayMode.bgAlignment = BG_POSITIONS[index]
}

function extractImage(image: string) {
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

function preloadGraphic(image: string) {
	let src = splitFirst(image, '$')[0]
	if (!src || !isImage(src))
		return
	if (src.startsWith('"'))
		src = src.replaceAll('"', '')
	return preloadImage(imageSrc(src)).catch(() => {})
}

//##############################################################################
//#region                       COMMAND HANDLERS
//##############################################################################

export function processImageCmd(
						 setTransition: (t: GraphicsTransition|undefined)=>void,
						 setRocket: (rocket: undefined) => void,
						 arg: string, cmd: string, script: ScriptPlayer,
						 onFinish: VoidFunction) {
	let pos = 'bg', image = '', effect = '', time = '', rest: string[] = []
	switch (cmd) {
		case 'bg' : [image, effect, time, ...rest] = arg.split(/,(?!.*`)/); break; // ignore commas inside image
		case 'ld' : [pos, image, effect, time] = arg.split(','); break;
		case 'cl' : [pos, effect, time] = arg.split(','); break;
		default : throw Error(`unknown image command ${cmd} ${arg}`)
	}
	let alignment: Graphics['bgAlign'] = undefined;
	if (rest.length > 0 && BG_POSITIONS.some(x=>rest.includes(x))) {
		alignment = rest.find(x=>BG_POSITIONS.includes(x as typeof BG_POSITIONS[number])) as Graphics['bgAlign']
		displayMode.bgMoveTime = +time || 0
	}
	if (image)
		image = extractImage(image)
	const duration = +time || 0
	const change = (pos == 'a' ) ? { l: "", c: "", r: "" }
			 : (pos == 'bg') ? { bg: image, bgAlign: alignment }
			 : { [pos]: image }
	const to = (pos == 'bg') ? { l: "", c: "", r: "", ...change } : change
	let finished = false

	const _onFinish = ()=> {
		if (finished)
			return
		finished = true
		if (!objectMatch(script.graphics, to)) {
			if (pos == 'a')
				script.graphics = {l: "", c: "", r: ""}
			else if (pos == 'bg') {
				if (alignment) {
					displayMode.bgAlignment = alignment
					displayMode.bgMoveTime = 0
				} else if (script.graphics.bgAlign) {
					displayMode.bgAlignment = "center"
				}
				script.graphics = {bg: image, l: "", c: "", r: "", bgAlign: alignment}
			} else {
				script.graphics[pos as SpritePos] = image
			}
			setTransition(undefined)
			setRocket(undefined)
		}
		onFinish()
	}

	// get image
	if (!objectMatch(script.graphics, to)) {
		if (duration <= 0) {
			_onFinish()
			return
		}
		let timer: Timer|undefined
		const startTransition = () => {
			if (finished)
				return
			setTransition({
				to: change,
				effect,
				duration,
				onFinish: _onFinish
			})
			if (to.bgAlign && to.bg == script.graphics.bg) {
				// Alignment transitions don't automatically call 'onFinish'.
				// Simulate with timer as a workaround.
				timer = new Timer(duration, _onFinish, false)
				timer.start()
			}
		}
		preloadGraphic(image)?.finally(startTransition) ?? startTransition()
		return { next: () => timer ? timer.skip() : _onFinish() }
	} else {
		setTransition(undefined)
	}
}


export function processQuake(
	setQuake: (quake: Quake|undefined)=>void,
	arg: string, cmd: string, _script: ScriptPlayer,
	onFinish: VoidFunction) {
	const [ampl, duration] = arg.split(',').map(x=>parseInt(x))
	const _onFinish = ()=> {
		setQuake(undefined)
		onFinish()
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
	return { next: _onFinish }
}

export function processRocket(
	setRocket: (rocket: Rocket | undefined) => void,
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

	const layer = params.layer as Rocket['layer']

	if (!SPRITES_POSITIONS.includes(layer)) {
		console.error(`Invalid layer for @rocket: ${layer}`)
		onFinish()
		return
	}
	const wait = (!Object.hasOwn(params, "wait") || params.wait == "true")

	const onAnimationEnd = () => {
		if (wait) {
			setRocket(undefined)
			onFinish()
		}
	}

	const rocket: Rocket = {
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