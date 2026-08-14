import { ScriptPlayerBase } from "@tsukiweb/common/script/ScriptPlayer"
import { CharId, LabelName, RouteDayName, RouteName } from "app/utils/types"
import { isScene } from "engine/utils"
import { settings } from "engine/settings"
import { assets, imageSrc, phaseTexts } from "translation/assets"
import { closeBB } from "@tsukiweb/common/utils/Bbcode"
import { getGameVariable, setGameVariable } from "engine/variables"
import { deepAssign, TSForceType } from "@tsukiweb/common/utils/utils"
import { CommandRecord, NumVarName, VarName, VarType } from "@tsukiweb/common/script/types"
import { History } from "./history"
import { extractInstructions } from "@tsukiweb/common/script/utils"
import { creditsScript, fetchBlockLines } from "./script-loader"

//#endregion ###################################################################
//#region                             TYPES
//##############################################################################

export type Phase = {
    route: RouteName
    routeDay: RouteDayName
    day: number|RouteDayName<'others'>
}

type PageBaseContent = {
    phase: Phase,
    textBox: 'nvl'|'adv'
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
    'eroskip': processEroSkip,
    'gosub': processGoSub,
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
    script.history.onPhase()

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

function processEroSkip(nb_pages: string, _cmd: string, script: ScriptPlayer, onFinish: VoidFunction) {
    switch (settings.eroSkip) {
        case 'no' : return
        case 'ask' :
            if (script.onEroSkipPrompt) {
                script.onEroSkipPrompt(+nb_pages).then(confirmed => {
                    if (confirmed) {
                        script.skipPages(+nb_pages, false)
                    }
                    onFinish()
                })
                return {
                    next: ()=>{}, // prevent continuing to next instruction
                }
            }
            return
    }
}

function processGoSub(arg: string, _: string, script: ScriptPlayer, onFinish: VoidFunction) {
    const label = arg.substring(1)
    if (label == 'ending') // include the credits as part of the scene
        return creditsScript(false).flatMap(extractInstructions)
    return [{cmd: 'goto', arg}]
}

//#endregion
//##############################################################################

export class ScriptPlayer extends ScriptPlayerBase<LabelName, CharId, PageBaseContent,
                                                   {}, History> {

//#endregion ###################################################################
//#region                         ATTRS & PROPS
//##############################################################################
    
//_____________________________private attributes_______________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    private _textBox: 'adv'|'nvl' = 'nvl'
    private _phase: Phase = { route: "others", routeDay: "pro", day: 0 }

//_______________________public attributes & properties_________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    flushcount: number = 0 //used in for loops in the script
    
    onEroSkipPrompt?: (nbPages: number) => Promise<boolean>

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
        const initContext = history.empty ? {
            ...ScriptPlayer.defaultBlockContext(),
            ...ScriptPlayer.defaultPageContext()
        } : history.getPageContext()
        
        super(history, initContext)
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
                    label: LabelName): boolean {
        if (super.isLinePageBreak(line, index, sceneLines, label))
            return true
        if (line.startsWith('phase')) {
            // avoid counting 2 pages for conditional phases which have 2 'phase'
            if (!sceneLines[index+1].startsWith('skip'))
                return true
        }
        return false
    }

    override pageContent() {
        return { phase: this.phase, textBox: this.textBox }
    }
    
    override blockContent() { return {} }

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
            points: { ark: 0, cel: 0, aki: 0, his: 0, koha: 0 },
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
        if (/^s\d+a?$/.test(label))
            return `skip${label.substring(1)}` as LabelName
        if (label == "openning")
            return "s20"
        return null
    }
    protected override preloadAssets(list: Set<string>): void {
        for (const asset of list) {
            assets.load(undefined, asset)
        }
    }

//#endregion
//##############################################################################

}
