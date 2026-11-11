import { getSceneTitle, getSceneTitles, isScene, isThScene } from "../../../engine/utils"
import { LabelName, SceneName } from "app/utils/types"
import { COLUMN_WIDTH, DY, FcNodeState, Flowchart, FlowchartNode, FlowchartNodeAttrs, SCENE_HEIGHT, SCENE_WIDTH, SpritesheetMetadataType } from "@tsukiweb/common/flowchart"
import SpritesheetMetadata from "@assets/game/spritesheet_metadata.json"
import { spriteSheetImgPath } from "translation/assets"
import { settings } from "../../../engine/settings"
import { History } from "../../../engine/history"
import FC from "../../../assets/game/flowchart.json"

//##############################################################################
//#region                       TYPES
//##############################################################################

type FcNodeId = SceneName|string
type FcNodeAttrs = FlowchartNodeAttrs<FcNodeId> & {
	col: number
	align?: FcNodeId
	cutAt?: number
}

//##############################################################################
//#region                           FLOWCHART
//##############################################################################

export class GameFlowchart extends Flowchart<FcNode> {
	public metadatas: Readonly<SpritesheetMetadataType> = SpritesheetMetadata
	private _history: History|undefined
	constructor(history?: History) {
		super({
			...(FC.nodes ?? {}),
			...Object.fromEntries(Object.entries(FC.scenes)
				.filter(([, { col }]) => col != undefined)) // filter non-fc scenes
		})
		this._history = history
	}

	protected createNode(id: string, attrs: FcNodeAttrs): FcNode {
		return new FcNode(id, attrs, this)
	}

	isSceneEnabled(id: FcNodeId): boolean {
		return this._history?.hasScene(id as LabelName)
			?? this.getNode(id)?.seen
			?? false
	}

	getSceneDisplayName(id: FcNodeId): string {
		const flags = this._history?.sceneContext(id as LabelName)?.flags
		if (flags)
			return getSceneTitle(flags, id as SceneName) ?? id
		else {
			const titles = getSceneTitles(id as SceneName)
			if (typeof titles == "object")
				return titles.titles.join('[br/]')
			return titles ?? id
		}
	}

	hasTransition(fromId: FcNodeId, toId: FcNodeId): boolean {
		const history = (this._history as any)?.scenes?.all()
		if (!history || history.length < 2) return false

		const fromNode = this.getNode(fromId)
		const toNode = this.getNode(toId)
		if (!fromNode || !toNode) return false

		const fromSet = new Set(fromNode.scene ? [fromId] : fromNode.parentSceneNodes.map(n => n.id))
		const toSet = new Set(toNode.scene ? [toId] : toNode.childSceneNodes.map(n => n.id))

		return history.some((scene: { label: string }, i: number) => 
			i < history.length - 1 && 
			fromSet.has(scene.label) && 
			toSet.has(history[i + 1].label)
		)
	}

	/**
	 * Playthrough mode: only transitions of the history are enabled.
	 * Viewer: links between enabled scenes are enabled.
	 */
	isLinkDisabled(parent: FcNode, node: FcNode, mode: 'playthrough' | 'viewer'): boolean {
		return mode == 'playthrough'
			? !this.hasTransition(parent.id, node.id)
			: parent.state !== FcNodeState.ENABLED || node.state !== FcNodeState.ENABLED
	}

	get activeScene(): FcNodeId {
		return this._history?.lastScene.label ?? ""
	}
}

//##############################################################################
//#region                             NODE
//##############################################################################

export class FcNode extends FlowchartNode<FcNodeId, GameFlowchart> {
	column: number
	cutAt: number
	scene: boolean
	private _align: FcNodeId | undefined
	private _top: number | undefined
	private _state: FcNodeState | undefined
	private _navY: number | undefined

	constructor(id: FcNodeId, {col, cutAt, align, ...attrs}: FcNodeAttrs,
				flowchart: GameFlowchart) {
		super(id, attrs, flowchart)
		this.column = col
		this.cutAt = cutAt ?? 0
		this.scene = isScene(id)
		this._align = align
	}

	get navY(): number | null {
		if (!this.scene || this.state < FcNodeState.ENABLED)
			return null
		return this._navY ??= Math.max(-1, ...this.parentSceneNodes.map(n => n.navY as number)) + 1
	}

	get parentSceneNodes(): FcNode[] {
		return this.parents.flatMap(node => node.scene ? [node] : node.parentSceneNodes)
	}

	get children(): FcNode[] {
		return this.flowchart.listNodes().filter(node => node.parents.includes(this))
	}

	get childSceneNodes(): FcNode[] {
		return this.children.flatMap(node => node.scene ? [node] : node.childSceneNodes)
	}

	get alignedNode(): FcNode | undefined {
		return this._align ? this.flowchart.getNode(this._align) : undefined
	}
	get seen(): boolean {
		if (!this.scene)
			return false
		if (settings.unlockEverything)
			return true
		return settings.completedScenes.includes(this.id)
	}

	get active(): boolean {
		return this.flowchart.activeScene == this.id
	}

	get state(): FcNodeState {
		return this._state ??= this.computeState()
	}

	private computeState(): FcNodeState {
		if (isThScene(this.id)) {
			if (this.flowchart.isSceneEnabled(this.id))
				return FcNodeState.ENABLED
			return this.seen ? FcNodeState.DISABLED : FcNodeState.UNSEEN
		}
		const parents = this.parentSceneNodes
		const parentsState = Math.max(FcNodeState.HIDDEN, ...parents.map(n => n.state))
		if (parentsState < FcNodeState.ENABLED)
			return parentsState
		return Math.max(FcNodeState.UNSEEN, ...this.childSceneNodes.map(n => n.state))
	}

	get metadatas() {
		const { f, d, i } = this.flowchart.metadatas
		const [top, left, fileIndex] = i[this.id]
		const [width, height] = d
		return { file: spriteSheetImgPath(f[fileIndex]), left, top, width, height }
	}

	get top(): number {
		return this._top ??= this.computeTop()
	}

	private computeTop(): number {
		if (this.alignedNode)
			return this.alignedNode.top
		if (this.parents.length > 0)
			return Math.max(0, ...this.parents.map(node => node.bottom)) + DY*2
		return 0
	}

	get width()  : number { return this.scene ? SCENE_WIDTH : 0 }
	get height() : number { return this.scene ? SCENE_HEIGHT : 0 }
	get centerX(): number { return this.column * COLUMN_WIDTH }
	get left()   : number { return this.centerX - this.width/2 }
	get right()  : number { return this.centerX + this.width/2 }
	get bottom() : number { return this.top + this.height }
	get displayName(): string {
		return this.flowchart.getSceneDisplayName(this.id)
	}
}
