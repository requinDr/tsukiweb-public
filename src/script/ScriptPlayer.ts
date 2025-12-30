import { ScriptPlayerBase } from "@tsukiweb-common/script/ScriptPlayer"
import { LabelName, RouteDayName, RouteName } from "types";
import { fetchBlockLines, isScene, nextLabel } from "script/utils";
import { settings } from "utils/settings";
import { phaseTexts } from "translation/assets";
import { closeBB } from "@tsukiweb-common/utils/Bbcode";
import { Graphics, StrVarName, NumVarName, VarName, RecursivePartial } from "@tsukiweb-common/types";
import { getGameVariable, setGameVariable } from "utils/variables";
import { deepAssign, TSForceType } from "@tsukiweb-common/utils/utils";
import { CommandRecord, VarType } from "@tsukiweb-common/script/utils";
import { History } from "./history";

//#endregion ###################################################################
//#region                             TYPES
//##############################################################################

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

type PageBaseContent = {
    phase: Phase,
    textBox: 'nvl'|'adv'
}

type BlockContent = {
    regard: Regard
}

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

export class ScriptPlayer extends ScriptPlayerBase<LabelName, PageBaseContent,
                                                   BlockContent, History> {

//#endregion ###################################################################
//#region                         ATTRS & PROPS
//##############################################################################
    
//_____________________________private attributes_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    private _regard: Regard = { ark: 0, cel: 0, aki: 0, his: 0, koha: 0 }
    private _textBox: 'adv'|'nvl' = 'nvl'
    private _phase: Phase = { route: "others", routeDay: "pro", day: 0 }

//_______________________public attributes & properties_________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    flushcount: number = 0 //used in for loops in the script

    get regard(): Regard { return this._regard }
    set regard(value: Partial<Regard>) {
        deepAssign(this._regard, value)
    }

    get phase(): Phase { return this._phase }
    set phase(value: Phase) {
        deepAssign(this._phase, value)
    }

    get textBox() { return this._textBox }
    set textBox(value: 'adv'|'nvl') { this._textBox = value }

//#endregion ###################################################################
//#region                          CONSTRUCTOR
//##############################################################################

    constructor(history: History) {
        const initContext = history.getPageContext()

        if (initContext.label == undefined)
            throw Error("unspecified label in context")
        
        super(history, initContext)
        deepAssign(this._regard, initContext.regard ?? {})
        deepAssign(this._phase, initContext.phase ?? {})
        this._textBox = initContext.textBox ?? "nvl"
        this.setCommands(commands)
        this.addEventListener('afterBlock', (label)=> {
            if (isScene(label) && !settings.completedScenes.includes(label))
                settings.completedScenes.push(label)
        })
    }

//#endregion ###################################################################
//#region                        PUBLIC METHODS
//##############################################################################

    override isLinePageBreak(line: string, index: number, sceneLines: string[],
                    label: LabelName, playing: boolean): boolean {
        if (super.isLinePageBreak(line, index, sceneLines, label, playing))
            return true
        if (line.startsWith('phase')) {
            if (playing) // count all phases as page while playing game
                return true
            // when counting pages outside of gameplay,
            // avoid counting 2 pages for conditional phases which have 2 'phase'
            if (!sceneLines[index+1].startsWith('skip'))
                return true
        }
        return false
    }

    override pageContent() {
        return { phase: this.phase, textBox: this.textBox }
    }
    
    override blockContent() {
        return { regard: {...this.regard} }
    }

    static override defaultPageContext() {
        return {
            ...ScriptPlayerBase.defaultPageContext(),
            phase: { route: "others", routeDay: "pro", day: 0 } as Phase,
            textBox: 'nvl' as typeof ScriptPlayer.prototype.textBox,
        }
    }
    
    static override defaultBlockContext() {
        return {
            ...ScriptPlayerBase.defaultBlockContext(),
            regard: { ark: 0, cel: 0, aki: 0, his: 0, koha: 0 },
        }
    }

//#endregion ###################################################################
//#region                      INHERITED ABSTRACTS
//##############################################################################

    override writeVariable<T extends VarName>(name: T, value: VarType<T>) {
        setGameVariable(this, name as NumVarName, value as number)
    }
    override readVariable<T extends VarName>(name: T): VarType<T> {
        return getGameVariable(this, name as NumVarName) as VarType<T>
    }

    override fetchLines(label: LabelName): Promise<string[]> {
        return fetchBlockLines(label)
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
