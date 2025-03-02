import { displayMode } from "./display";
import { wordImage } from "../translation/assets";
import { extractInstructions } from "./scriptUtils";
import { gameContext } from "./variables";
import { settings } from "./settings"
import { SpritePos } from "@tsukiweb-common/types";
import { observe } from "@tsukiweb-common/utils/Observer";
import { splitFirst, splitLast, objectMatch } from "@tsukiweb-common/utils/utils";
import { getTransition, quakeEffect, transition } from "@tsukiweb-common/utils/graphics";
import { imagePath } from "./gallery";


export function endTransition() {
	transition.duration = 0
}

export function extractImage(image: string) {
	let text;
	[image, text] = splitFirst(image, '$')
	if (image.startsWith('"') && image.endsWith('"')) {
		// remove ':a;', 'image/', '"', '.jpg'
		image = image.substring(1, image.length-1)
								 .replace(/:a;|image[\/\\]|\.\w+$/g, '')
								 .replace('\\', '/')
		const [dir, name] = image.split('/')
		
		// Save to gallery if it's a new image
		if (imagePath(name) == image) {
			if (!settings.eventImages.includes(image))
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

export function applyChange(pos: SpritePos, image: string, type: string, onFinish: VoidFunction) {
	let change = setSprite(pos as SpritePos, image)

	if (pos == 'bg' && !change && objectMatch(gameContext.graphics, {l: "", c: "", r: ""}))
		change = true

	// update transition only if sprites have been changed
	if (change) {
		const {effect, duration} = getTransition(type)
		transition.effect = effect
		transition.duration = duration
		transition.pos = pos as SpritePos|'a'

		if (duration > 0) {
			displayMode.graphics = true
			// Listen for the 'duration' to be set to 0
			// The component sets it to 0 after completing the animation,
			// and calling 'next' the command also sets it to 0
			observe(
				transition,
				'duration',
				pos != 'bg' ? onFinish : ()=> { clearAllSprites(); onFinish() },
				{ filter: (d)=> d == 0, once: true }
			)
			return { next: endTransition }
		} else if (pos == 'bg') {
			// instant background change erases all sprites
			clearAllSprites()
		}
	}
}

function clearAllSprites() {
	const graphics = gameContext.graphics
	const changed = (graphics.l != "" || graphics.c != "" || graphics.r != "")
	graphics.l = ""
	graphics.c = ""
	graphics.r = ""
	return changed
}

export function setSprite(pos: SpritePos|'a', image: string): boolean {
	if (pos == 'a') {
		if (image.length > 0)
			throw Error("Unexpected image parameter with 'a' position")
		return clearAllSprites()
	} else if (gameContext.graphics[pos as SpritePos] != image) {
		gameContext.graphics[pos as SpritePos] = image
		return true
	} else {
		return false
	}
}

/**
 * Move background up or down
 */
export function moveBg(direction: "up"|"down") {
	const positions: Array<typeof displayMode.bgAlignment> = ["top", "center", "bottom"]
	let index = positions.indexOf(displayMode.bgAlignment)
	if (direction == "down" && index < 2) index++
	else if(direction == "up" && index > 0) index--
	displayMode.bgAlignment = positions[index]
}


//_______________________________script commands________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
function processImageCmd(arg: string, cmd: string, onFinish: VoidFunction) {
	if (arg.includes('%type_')) { // if the effect starts with "%type_", use old parser
		return processImageCmdOld(arg, cmd, onFinish)
	}
	let pos = 'bg', image = '', effect = '', time = ''
	switch (cmd) {
		case 'bg' : [image, effect, time] = arg.split(/,(?!.*`)/); break; // ignore commas inside image
		case 'ld' : [pos, image, effect, time] = arg.split(','); break;
		case 'cl' : [pos, effect, time] = arg.split(','); break;
		default : throw Error(`unknown image command ${cmd} ${arg}`)
	}
	//FIXME revious implementation. must be updated with new script pre-processing
	//check if text line starts right after command
	const match = /\D/.exec(time)
	if (match) {
		const secondInstrLength = time.length - match.index
		return [
			{cmd, arg: arg.substring(0, arg.length - secondInstrLength)},
			...extractInstructions(time.substring(time.length - secondInstrLength))
		]
	} else {
		// get image
		if (image)
			image = extractImage(image)
		return applyChange(pos as SpritePos, image, `${effect}_${time}`, onFinish)
	}
}

/** @deprecated */
function processImageCmdOld(arg: string, cmd: string, onFinish: VoidFunction) {
	let pos: string = 'bg',
			image: string = '',
			type: string = ''

	switch(cmd) {
		case 'bg': [image, type] = splitLast(arg, ',') as [string, string]; break
		case 'cl': [pos, type] = arg.split(','); break
		case 'ld':
			let arg1
			[pos, arg1] = splitFirst(arg, ',') as [string, string]
			[image, type] = splitLast(arg1, ',') as [string, string]
			break
		default : throw Error(`unknown image command ${cmd} ${arg}`)
	}

	type = type.replace('%', '')
	//check if text line starts right after command
	const match = /\W/.exec(type)
	if (match) {
		const secondInstrLength = type.length - match.index
		return [
			{cmd, arg: arg.substring(0, arg.length - secondInstrLength)},
			...extractInstructions(type.substring(type.length - secondInstrLength))
		]
	} else {
		// get image
		if (image)
			image = extractImage(image)
		return applyChange(pos as SpritePos, image, type, onFinish)
	}
}

function processQuake(arg: string, cmd: string, onFinish: VoidFunction) {
	const [ampl, duration] = arg.split(',').map(x=>parseInt(x))
	switch(cmd) {
		case 'quakex' : quakeEffect.x = ampl; break
		case 'quakey' : quakeEffect.y = ampl; break
	}
	quakeEffect.duration = duration;
	observe(quakeEffect, "duration", ()=> {
		quakeEffect.x = 0
		quakeEffect.y = 0
		onFinish()
	}, { filter: (d: number)=> d == 0, once: true })
	return { next: ()=> { quakeEffect.duration = 0 } }
}

function processMonocro(color: string) {
	if (color == "off")
		color = ""
	gameContext.graphics.monochrome = color
}

const commands = {
	'bg' : processImageCmd,
	'ld' : processImageCmd,
	'cl' : processImageCmd,
	'quakex'  : processQuake,
	'quakey'  : processQuake,
	'monocro' : processMonocro, //TODO : crossfade ?
}

export {
	commands
}