import { commands as choiceCommands } from "./choices"
import { commands as graphicCommands } from "./graphics"
import { commands as textCommands } from "./text"
import { LabelName, TsukihimeSceneName, SceneName } from "../types"
import { commands as audioCommands } from "./audio"
import history from "./history"
import { SCENE_ATTRS } from "./constants"
import { commands as timerCommands } from "./timer"
import { checkIfCondition, creditsScript, extractInstructions, fetchFBlock, fetchScene, isScene, isThScene } from "./scriptUtils"
import { commands as variableCommands } from "./variables"
import { gameContext } from "./gameContext"
import { settings } from "./settings"
import { toast } from "react-toastify"
import { SCREEN, displayMode } from "./display"
import { strings } from "../translation/lang"
import { phaseTexts } from "../translation/assets"
import { isObserverNotifyPending, observe } from "@tsukiweb-common/utils/Observer"
import Timer from "@tsukiweb-common/utils/timer"
import { closeBB } from "@tsukiweb-common/utils/Bbcode"

type Instruction = {cmd: string, arg: string}
type CommandHandler = {next: VoidFunction, cancel?: VoidFunction, autoPlayDelay?: number}
type CommandProcessFunction =
		((arg: string, cmd: string, onFinish: VoidFunction)=>CommandHandler|Instruction[]|void)
type CommandMap = Map<string, CommandProcessFunction|null>

type SkipCallback = (scene: TsukihimeSceneName, confirm:(skip: boolean)=>void)=>void

type FastForwardStopCondition = (line:string, context: typeof gameContext)=>boolean

let sceneLines: Array<string> = []
let currentCommand: CommandHandler | undefined
let skipCommand: VoidFunction | undefined
let lineSkipped: boolean = false
let autoPlay: boolean = false
let fastForwardDelay: number = 0
let fastForwardStopCondition: FastForwardStopCondition|undefined = undefined

const LOCK_CMD = {next: ()=>{}} // prevent proceeding to next line

//#endregion ###################################################################
//#region                          SKIP PROMPT                                 #
//##############################################################################

let pendingSkip: TsukihimeSceneName | null = null
let skipCallback : SkipCallback | null = null
let skipCancelCallback: VoidFunction | null = null

/**
 * callback function sent to the skip handler, called when the user has
 * chosen to skip or not.
 */
function skipConfirm(label: TsukihimeSceneName, skip: boolean) {
	if (skip) {
		history.onSceneSkip()
		onSceneEnd(label)
	} else {
		// check if context was changed while asking user
		if (label == gameContext.label) {
			gameContext.index = 0
			fetchSceneLines()
		}
	}
}

/**
 * Set the callbacks to call when a scene can be skipped, and the one to call
 * when a skip prompt is canceled by loading another save
 */
export function setSkipHandlers(onSkipPrompt: SkipCallback, cancel: VoidFunction) {
		skipCallback = onSkipPrompt
		skipCancelCallback = cancel
		// if a skip prompt was requested before the callback is set,
		// call it immediately.
		if (pendingSkip) {
			onSkipPrompt(pendingSkip, skipConfirm.bind(undefined, pendingSkip))
			pendingSkip = null
		}
}
export function removeSkipHandlers() {
	skipCallback = null
	skipCancelCallback = null
}

function promptSkip(scene: TsukihimeSceneName) {
	
	currentCommand = {
		next: ()=>{},
		cancel: cancelSkip
	}

	if (skipCallback)
		skipCallback(scene, skipConfirm.bind(undefined, scene))
	else {
		console.debug("skip callback not registered yet")
		// skip callback is not yet registered. Store the skip parameters to use
		// when the callback is registered.
		pendingSkip = scene
		// if after 2 seconds, the callback is still not registered, cancel the skip
		// and log the error
		setTimeout(()=> {
			if (pendingSkip) {
				console.error("Skip callback not registered after 2 seconds. Cancel skip")
				skipConfirm(scene, false)
			}
		}, 2000)
	}
}

function cancelSkip() {
	if (skipCancelCallback)
		skipCancelCallback()
	else {
		pendingSkip = null
	}
}

//#endregion ###################################################################
//#region                        PUBLIC STRUCTURE                              #
//##############################################################################

export const script = {
	/**
	 * function to call to move to the next step of the current command.
	 * Most commands will interpet it as a "skip".
	 */
	next(): void {
		if (currentCommand)
			currentCommand.next()
	},

	set autoPlay(enable: boolean) {
		if (enable != autoPlay) {
			autoPlay = enable
			if (enable) {
				makeAutoPlay()
			}
		}
	},

	get autoPlay() {
		return autoPlay
	},

	get currentLine() {
		return sceneLines[gameContext.index]
	},

	getOffsetLine(offset: number) {
		return sceneLines[gameContext.index+offset]
	},
	
	getPageIndex(page: number) {
		if (page == 0)
			return 0
		let p = 0
		for (const [i, line] of sceneLines.entries()) {
			if (line.startsWith('\\')) {
				p += 1
				if (p == page)
					return i+1
			} else if (/^gosub \*(right|left)_phase/.test(line)) {
				if (!sceneLines[i+1].startsWith('skip')) { // prevents counting 2 pages for conditional phases
					p += 1
					if (p == page)
						return i+1
				}
			}
		}
		return sceneLines.length // return end of file if not enough pages
	},
	getPageAtIndex(index: number) {
		let p = 0
		for (const [i, line] of sceneLines.entries()) {
			if (i == index)
				break
			
			if (line.startsWith('\\'))
				p += 1
			else if (/^gosub \*(right|left)_phase/.test(line) &&
					 !sceneLines[i+1].startsWith('skip')) // prevents counting 2 pages for conditional phases
				p += 1
		}
		return p
	},

	moveTo(label: LabelName|'', index: number = -1) {
		gameContext.label = label
		gameContext.index = index
	},

	fastForward(condition: FastForwardStopCondition|undefined,
							delay = settings.fastForwardDelay) {
		fastForwardDelay = delay
		fastForwardStopCondition = condition
		if (fastForwardStopCondition)
			makeAutoPlay()
	},

	get isFastForward() {
		return fastForwardStopCondition != undefined
	},

	isCurrentLineText() {
		return this.currentLine && this.currentLine.startsWith('`')
	}
}
export default script

function processPhase(dir: "l"|"r") {
	const {bg, route, routeDay, day} = gameContext.phase
	const [hAlign, vAlign, invDir] =
			(dir == "l") ? ["[left]", "t", "r"]
									 : ["[right]", "b", "l"]
	let [title, dayStr] = phaseTexts(route, routeDay, day).map(closeBB)
	
	let texts
	const common = `bg ${bg}$${vAlign}\`${hAlign}${title}`
	if (dayStr) {
		texts = [
			`${common}\n[hide][size=80%]${dayStr}\`,${invDir}cartain,400`,
			`${common}\n[size=80%]${dayStr}\`,crossfade,400`,
		]
	} else {
		texts = [
			`${common}\`,${invDir}cartain,400`
		]
	}
	history.onPhase(route, routeDay, day, bg)
	return [
		...extractInstructions(`playstop`),
		...extractInstructions(`wavestop`),
		...extractInstructions(`monocro off`),
		...extractInstructions(`bg ${bg},${dir}cartain,400`),
		...(texts.map(extractInstructions).flat()),
		{cmd: "click", arg: Math.max(1000, settings.nextPageDelay).toString()},
		...extractInstructions(`bg #000000,crossfade,400`),
		...extractInstructions(`inc %page`)
	];
}

function cancelCurrentCommand() {
	currentCommand?.cancel?.()
	if (skipCommand) {
		lineSkipped = true;
		skipCommand()
	}
	currentCommand = undefined
}

//#endregion ###################################################################
//#region                            COMMANDS                                  #
//##############################################################################

let commands:CommandMap|undefined;
function buildCommands() {
	commands = new Map(Object.entries<CommandProcessFunction|null>({

		...textCommands,
		...graphicCommands,
		...audioCommands,
		...timerCommands,
		...variableCommands,
		...choiceCommands,

		'if'        : processIfCmd,
		'goto'      : processGoto,
		'gosub'     : processGosub,

		'osiete'    : (label)=> {
			/* TODO : dialog box to ask user. if yes, `goto label`, if not, `goto *endofplay`*/
			processGoto(label)
		},

		'skip'      : (n)=> { gameContext.index += parseInt(n) },
		'return'    : ()=> { onSceneEnd(); return LOCK_CMD },
		'click'     : processClick,

		...Object.fromEntries([ // ignored commands
			'setwindow', 'windoweffect',
			'setcursor', 'autoclick',
			'*', '!s',
		].map(cmd=>[cmd, null]))
	})) as CommandMap
}

function processIfCmd(arg: string, _: string) {
	let index = arg.search(/ [a-z]/)
	if (index == -1)
		throw Error(`no separation between condition and command: "if ${arg}"`)
	const condition = arg.substring(0, index)
	if (checkIfCondition(condition))
		return extractInstructions(arg.substring(index+1))
}

function processGoto(arg: string) {
	if (/^\*f\d+\w*$/.test(arg)) {
		script.moveTo(arg.substring(1) as LabelName, 0)
		return LOCK_CMD // prevent processing next line
	} else if (arg == "*endofplay") {
		script.moveTo("endofplay")
		//TODO end session, return to title screen
		return LOCK_CMD // prevent processing next line
	}
}

function processGosub(arg: string, _: string) {
	if (arg == "*right_phase" || arg == "*left_phase") {
		return processPhase((arg == "*left_phase") ? "l" : "r")
	} else if (arg == "*ending") {
		return creditsScript().map(extractInstructions).flat(1)
	} else if (isThScene(arg)) {
		script.moveTo(arg.substring(1) as SceneName)
		return LOCK_CMD
	}
}

function processClick(arg: string, _: string, onFinish: VoidFunction) {
	if (arg.length > 0) {
		// inserted a delay in the `click` argument. (Not standard Nscripter).
		const delay = parseInt(arg)
		return { next: onFinish, autoPlayDelay: delay }
	} else {
		return { next: onFinish }
	}
}

//#endregion ###################################################################
//#region                      EXECUTE SCRIPT LINES                            #
//##############################################################################

function makeAutoPlay() {
	const cmd = currentCommand
	if (!cmd)
		return;
	const fastForward = fastForwardStopCondition != undefined
	if (!fastForward && typeof cmd.autoPlayDelay != "number")
		return
	const next = cmd?.next.bind(cmd)
	const delay = fastForward ? fastForwardDelay : cmd.autoPlayDelay as number
	const timer = new Timer(delay, ()=> {
		if (autoPlay || fastForwardStopCondition)
			next()
	})
	timer.start()
	cmd.next = ()=> { timer.cancel(); next() }
	const skip = skipCommand
	skipCommand = ()=> {
		timer.cancel()
		skip?.()
	}
}
/**
 * Execute the script line. Extract the command name and arguments from the line,
 * and calls the appropriate function to process it.
 * Update currentCommand.
 * @param line the script line to process
 * @param onFinish callback function called when the line has been processed
 */
export async function processLine(line: string) {
	const instructions = extractInstructions(line)
	for (let i=0; i< instructions.length; i++) {
		const {cmd, arg} = instructions[i]
		if (lineSkipped)
			break

		if (!commands)
			buildCommands()

		const command = commands?.get(cmd)
		if (command) {
			await new Promise<void>(resolve=> {
				let commandResult = command(arg, cmd, resolve)
				if (Array.isArray(commandResult)) {
					instructions.splice(i+1, 0, ...commandResult)
					currentCommand = undefined
					resolve()
				} else if (commandResult) {
					currentCommand = commandResult
					skipCommand = resolve // if the command must be skipped at some point
					if (autoPlay || fastForwardStopCondition)
						makeAutoPlay()
				} else
					resolve()
			})
			currentCommand = undefined
			skipCommand = undefined
		}
		else if (!commands?.has(cmd)) {
			const {label: scene, index} = gameContext
			console.error(`unknown command ${scene}:${index}: ${line}`)
			debugger
		}
	}
}

/**
 * Executed when {@link gameContext.index} is modified,
 * when the scene is loaded, or when the screen changes.
 * Calls the execution of the command at the current line index
 * in the scene file
 */
async function processCurrentLine() {
	const {index, label} = gameContext
	const lines = sceneLines
	if (index < 0 || // no valid line index
			label.length == 0 || // no specified scene
			lines.length == 0 || // scene not loaded
			displayMode.screen != SCREEN.WINDOW) // not in the right screen
		return
	if (currentCommand) {
		// Index/Label changed while executing an instruction.
		// Cancel unfinished instructions.
		console.debug(`canceling execution of line ${label}:${index}`)
		cancelCurrentCommand()
		// Process the current line after aborting the previous line
		setTimeout(processCurrentLine, 0)
		return
	}

	if (index < lines.length) {
		let line = lines[index]
		console.debug(`${label}:${index}: ${line}`)

		if (fastForwardStopCondition?.(line, gameContext))
			fastForwardStopCondition = undefined

		await processLine(line)
		if (lineSkipped || gameContext.index != index || gameContext.label != label) {
			// Index/Label changed while executing the instruction.
			// processCurrentLine() will be called again by the observer.
			// The index should not be incremented
			lineSkipped = false
			//TODO check if test below is necessary with last version
			//if (history.lastPage?.index == index)
			//	history.pop() // if the skipped line is the first of the page, remove page from history
		} else {
			gameContext.index++
		}
	} else {
		onSceneEnd()
	}
}

async function fetchSceneLines() {
	const label = gameContext.label
	let fetchedLines: string[]|undefined = undefined
	if (isScene(label))
		fetchedLines = await fetchScene(label)
	else if (/^(f|skip)\d+\w*$/.test(label))
		fetchedLines = await fetchFBlock(label)

	if (fetchedLines == undefined)
		throw Error(`error while fetching lines for label ${label}`)
	// check if context was changed while fetching the file
	if (label == gameContext.label) {
		sceneLines = fetchedLines
		if (!isObserverNotifyPending(gameContext, 'index'))
			processCurrentLine()
	}
}

/**
 * Executed when {@link gameContext.label} is modified.
 * Loads the scene or script block and starts the execution of lines.
 * {@link gameContext.index} is not modified.
 * To start from line 0, set {@link gameContext.index} to 0.
 * @param label id of the scene or block to load.
 */
async function loadLabel(label: LabelName|"") {
	if (label == "") {
		sceneLines = []
	} else if (label == "endofplay") {
		console.debug("going back to title")
		displayMode.screen = SCREEN.TITLE
	} else {
		console.debug(`load label ${label}`)
		sceneLines = [] // set to empty to prevent execution of previous scene
		if (gameContext.index == -1)
			onSceneStart()
		else
			fetchSceneLines()
	}
}
export function skipSceneLabel(label = gameContext.label) {
	if (/^s\d+a?$/.test(label))
		return `skip${label.substring(1)}` as LabelName
	else if (label == "openning")
		return 's20'
	else
		return 'endofplay'
}

function onSceneEnd(label = gameContext.label, nextLabel:LabelName|undefined=undefined) {
	console.debug(`ending ${label}`)
	if (!gameContext.continueScript) {
		window.history.back(); // return to previous screen
	} else if (isScene(label)) {
		// add scene to completed scenes
		if (!settings.completedScenes.includes(label))
			settings.completedScenes.push(label)
		if (nextLabel)
			script.moveTo(nextLabel)
		else
			script.moveTo(skipSceneLabel(label))
	}
}

export function warnHScene() {
	toast(strings.game["toast-hscene-waning"], {
		toastId: "hscene-warning",
		autoClose: 4000
	})
}

function onSceneStart() {
	const label = gameContext.label as SceneName
	const thScene = isThScene(label)
	if (thScene && settings.enableSceneSkip &&
			settings.completedScenes.includes(label)) {
		if (currentCommand) {
			cancelCurrentCommand()
			setTimeout(onSceneStart, 0) // wait for the cancel to complete
		}
		else {
			promptSkip(label)
		}
	} else {
		if (thScene && settings.warnHScenes && SCENE_ATTRS.scenes[label]?.h)
			warnHScene()
		gameContext.index = 0
		fetchSceneLines()
	}
}

observe(gameContext, 'label', loadLabel)
observe(gameContext, 'index', processCurrentLine)
observe(gameContext, 'page', (page)=> {
	if (page != 0 && gameContext.index <= 0 && sceneLines.length > 0)
		gameContext.index = script.getPageIndex(page)
})
observe(displayMode, 'screen', (screen)=> {
	if (screen != SCREEN.WINDOW) {
		// clear values not in gameContext
		//currentCommand = undefined
		lineSkipped = false
		autoPlay = false
		fastForwardStopCondition = undefined
	}
	else if (!isObserverNotifyPending(gameContext, 'index'))
		processCurrentLine()
})

//#endregion ###################################################################
//#region                             DEBUG                                    #
//##############################################################################

window.script = script
