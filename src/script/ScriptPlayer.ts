import { ScriptPlayerBase, ScriptPlayerCallbacks } from "@tsukiweb-common/script/ScriptPlayer"
import { LabelName, RouteDayName, RouteName } from "types";
import { fetchBlockLines, isScene, nextLabel } from "script/utils";
import { settings } from "utils/settings";
import { phaseTexts } from "translation/assets";
import { closeBB } from "@tsukiweb-common/utils/Bbcode";
import { Graphics, StrVarName, NumVarName, VarName, RecursivePartial } from "@tsukiweb-common/types";
import { getGameVariable, setGameVariable } from "utils/variables";
import { deepAssign, TSForceType } from "@tsukiweb-common/utils/utils";
import { CommandRecord } from "@tsukiweb-common/script/utils";
import { History, PageEntry, PageType, SceneEntry } from "utils/history";

type Audio = {
  track: string | null
  looped_se: string | null
}

export type Regard = {
  ark: number
  cel: number // previous name ciel can be loaded from saves
  aki: number // previous name akiha can be loaded from saves
  koha: number // previous name kohaku can be loaded from saves
  his: number // previous name hisui can be loaded from saves
}
export type Phase = {
    route: RouteName
    routeDay: RouteDayName
    day: number|RouteDayName<'others'>
}

export type InitContext = RecursivePartial<{
    label: LabelName
    page: number
    audio: Audio
    graphics: Graphics
    phase: Phase
    regard: Regard
    flags: Iterable<string>
    textPrefix: string
    textBox: typeof ScriptPlayer.prototype.textBox
    conitnueScript: boolean
}>

type Callbacks = ScriptPlayerCallbacks<LabelName>

//#endregion ###################################################################
//#region                         BASE COMMANDS
//##############################################################################

/**
 * implementation-specific commands
 */
const commands: CommandRecord<ScriptPlayer> = {
    'phase'  : processPhase,
    'click'  : processClick,
    'osiete' : (label)=> {
        // TODO : dialog box to ask user if the scene is not already seen.
        // if yes, `goto label`, if not, 
        // `goto *endofplay`
        return [{cmd:'goto', arg: label}]
    },
}

function processClick(arg: string, _: string, script: ScriptPlayer,
                      onFinish: VoidFunction) {
    if (arg.length > 0) {
        // inserted a delay in the `click` argument. (Not standard Nscripter).
        const delay = parseInt(arg)
        return { next: onFinish, autoPlayDelay: delay }
    } else {
        return { next: onFinish }
    }
}

type PhaseArgs = [string, 'l'|'r', RouteName, RouteDayName, `${number}`|number|RouteDayName<'others'>]
function processPhase(arg: string, _cmd: string, script: ScriptPlayer) {
    // split at ',', ignore ',' in image
	let [bg, dir, route, routeDay, day] = arg.split(/,(?!.*")/) as PhaseArgs
	const [hAlign, vAlign, invDir] =
			(dir == "l") ? ["[left]", "t", "r"]
						 : ["[right]", "b", "l"]
    if (/^\d+$/.test(day as string))
        day = +day
    TSForceType<Exclude<typeof day, `${number}`>>(day)
	let [title, dayStr] = phaseTexts(route, routeDay, day).map(closeBB)

    script.phase = {route, routeDay, day}
    script.history.onPhase(script)

	let texts
	const common = `${bg}$${vAlign}\`${hAlign}${title}`
    texts = dayStr ? [
            `${common}\n[hide][size=80%]${dayStr}\`,${invDir}cartain,400`,
            `${common}\n[size=80%]${dayStr}\`,crossfade,400`,
        ] : [
            `${common}\`,${invDir}cartain,400`
        ]
    return [
        {cmd:'playstop'}, {cmd:'wavestop'}, {cmd:'monocro', arg: "off"},
        {cmd:'bg', arg: `${bg},${dir}cartain,400`},
        ...texts.map(bg=>({cmd: 'bg', arg: bg})),
        {cmd: 'click', arg: Math.max(1000, settings.nextPageDelay).toString()},
        {cmd: 'bg', arg: "#000000,crossfade,400"},
    ]
}

//#endregion
//##############################################################################

export class ScriptPlayer extends ScriptPlayerBase<LabelName> {

//#endregion ###################################################################
//#region                         ATTRS & PROPS
//##############################################################################
    
//_____________________________private attributes_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    private _flags = new Set<string>()
    private _regard: Regard = { ark: 0, cel: 0, aki: 0, his: 0, koha: 0 }
    private _continueScript: boolean
    private _textPrefix : string // add bbcode before text lines (for e.g., color or alignement)
    private _textBox: 'adv'|'nvl' = 'nvl'
    private _text: string = ""
    private _audio: Audio = { track: '', looped_se: '' }
    private _graphics: Graphics =
        { bg: '', l: '', c: '', r: '', monochrome: '' }
    private _phase: Phase = { route: "others", routeDay: "pro", day: 0 }
    
    private _history: History
    private _uid: number

//_______________________public attributes & properties_________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    flushcount: number = 0 //used in for loops in the script

    get regard(): Regard { return this._regard }
    set regard(value: Partial<Regard>) {
        deepAssign(this._regard, value)
    }
    get flags() { return this._flags }

    get continueScript() { return this._continueScript }

    get audio(): Audio { return this._audio }
    set audio(value: Partial<Audio>) {
        deepAssign(this._audio, value, {extend: false})
    }
    get graphics(): Graphics { return this._graphics }
    set graphics(value: Partial<Graphics>) {
        deepAssign(this._graphics, value, {extend: false})
    }
    get phase(): Phase { return this._phase }
    set phase(value: Phase) {
        deepAssign(this._phase, value)
    }
    get textPrefix() { return this._textPrefix }
    set textPrefix(value: string) { this._textPrefix = value }
    get textBox() { return this._textBox }
    set textBox(value: 'adv'|'nvl') { this._textBox = value }
    get text() { return this._text }
    set text(value: string) {
        this._text = value
        this._history.onTextChange(this)
    }

    get history() { return this._history }
    get uid() { return this._uid }

//#endregion ###################################################################
//#region                          CONSTRUCTOR
//##############################################################################

    constructor(history: History, callbacks?: Partial<Callbacks>) {
        const initContext = history.getPageContext() as NonNullable<PageEntry & SceneEntry>
        const {label: initLabel = 'openning', page: initPage = 0} = initContext
        if (initLabel == undefined)
            throw Error("unspecified label in context")

        super(initLabel, initPage, callbacks)
        
        deepAssign(this._graphics, initContext.graphics ?? {})
        deepAssign(this._audio, initContext.audio ?? {})
        deepAssign(this._regard, initContext.regard ?? {})
        deepAssign(this._phase, initContext.phase ?? {})
        for (const flag of initContext.flags ?? [])
            this._flags.add(flag)
        this._textPrefix = initContext.textPrefix ?? ""
        this._textBox = initContext.textBox ?? "nvl"
        this._continueScript = initContext.continueScript ?? true
        this.setCommands(commands)

        this._history = history
        this._uid = Date.now()
    }

//#endregion ###################################################################
//#region                        PUBLIC METHODS
//##############################################################################

    pageContext() {
        if (!this.currentBlock)
            return undefined
        return {
            page: this.currentBlock.page ?? 0,
            label: this.currentLabel as LabelName,
            graphics: {...this.graphics},
            audio: this.audio,
            phase: this.phase,
            textPrefix: this.textPrefix,
            textBox: this.textBox,
            text: this.text,
        }
    }

    static defaultPageContext() {
        return {
            type: 'text' as PageType,
            page: 0,
            graphics: {bg: "", l:"", c:"", r:"", monochrome: ""},
            audio: {track: "", looped_se: ""},
            textPrefix: "",
            textBox: 'nvl' as typeof ScriptPlayer.prototype.textBox,
            text: "",
        }
    }
    
    blockContext() {
        if (!isScene(this.currentLabel as LabelName))
            return undefined
        return {
            label: this.currentLabel as LabelName,
            flags: [...this.flags],
            regard: {...this.regard},
            continueScript: this._continueScript,
        }
    }
    
    static defaultBlockContext() {
        return {
            flags: [] as string[],
            regard: { ark: 0, cel: 0, aki: 0, his: 0, koha: 0 },
            continueScript: true
        }
    }

//#endregion ###################################################################
//#region                      INHERITED ABSTRACTS
//##############################################################################

    override writeVariable(name: StrVarName, value: string): void
    override writeVariable(name: NumVarName, value: number): void
    override writeVariable(name: VarName, value: string | number): void {
        setGameVariable(this, name as NumVarName, value as number)
    }
    override readVariable(name: StrVarName): string
    override readVariable(name: NumVarName): number
    override readVariable(name: VarName): string | number {
        return getGameVariable(this, name as NumVarName)
    }

    override fetchLines(label: LabelName): Promise<string[]> {
        return fetchBlockLines(label)
    }
    override isLinePageBreak(line: string, index: number, sceneLines: string[],
                    label: LabelName, playing: boolean): boolean {
        if (playing) {
            return line.startsWith('\\') || line.startsWith('phase ')
        } else {
            if (line.startsWith('\\'))
                return true
            else if (line.startsWith('phase'))
                // prevents counting 2 pages for conditional phases
                return !sceneLines[index+1].startsWith('skip')
            else
                return false
        }
    }
    protected override beforeBlock(label: LabelName, initPage: number): Promise<void> {
        this.history.onBlockStart(this, label)
        return super.beforeBlock(label, initPage)
    }
    protected override async afterBlock(label: LabelName): Promise<void> {
        if (isScene(label) && !settings.completedScenes.includes(label)) {
            settings.completedScenes.push(label)
        }
        await super.afterBlock(label)
    }
    override onPageStart(line: string, index: number, blockLines: string[],
                         label: LabelName): void {
        super.onPageStart(line, index, blockLines, label)
        this.history.onPageStart(this)
        this.text = ""
    }
    protected override nextLabel(label: LabelName): LabelName | null {
        const result = nextLabel(label)
        if (result == "endofplay")
            return null
        return result
    }

//#endregion
//##############################################################################

}
