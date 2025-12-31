import { isScene, isThScene } from "../script/utils"
import { LabelName, TsukihimeSceneName } from "types"
import { SCENE_ATTRS } from "./constants"
import { Graphics } from "@tsukiweb-common/types"
import { Flowchart, FlowchartNode, FlowchartNodeAttrs } from "@tsukiweb-common/utils/flowchart"
import SpritesheetMetadata from "@assets/game/spritesheet_metadata.json"
import { spriteSheetImgPath } from "translation/assets"
import { settings } from "./settings"
import { History } from "../script/history"

//##############################################################################
//#region                       CONSTANTS & TYPES
//##############################################################################

export const SCENE_WIDTH = 31
export const SCENE_HEIGHT = 22
export const COLUMN_WIDTH = SCENE_WIDTH + 2
export const DY = 3
export const OVERLAP_BREAK_LENGTH = 2

export const SCENE_RECT_ATTRS = {
	width: SCENE_WIDTH,
	height: SCENE_HEIGHT,
	x: -SCENE_WIDTH/2,
	y: -SCENE_HEIGHT/2
}

export type SpritesheetMetadataType = {
	d: {
		w: number
		h: number
	}
	f: string[] // file names
	i: {
		[key: string]: number[] // [top, left, file index]
	}
}

type FcNodeId = TsukihimeSceneName|string
type FcNodeAttrs = FlowchartNodeAttrs<FcNodeId> & {
	col: number
	align?: FcNodeId
	cutAt?: number
	graph?: Graphics
}

//##############################################################################
//#region                           FLOWCHART
//##############################################################################

export class TsukihimeFlowchart extends Flowchart<FcNode> {
	public metadatas: Readonly<SpritesheetMetadataType> = SpritesheetMetadata
	private _history: History|undefined
	constructor(history?: History) {
		super({
			...(SCENE_ATTRS["fc-nodes"] ?? {}),
			...Object.entries(SCENE_ATTRS.scenes).reduce((acc, [id, { fc }]) => {
				if (fc) acc[id] = fc // filter non-fc scenes
				return acc
			}, {} as Record<string, FcNodeAttrs>)
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

	get activeScene(): FcNodeId {
		return this._history?.lastScene.label ?? ""
	}
}
export enum FcNodeState {
	HIDDEN,
	UNSEEN,
	DISABLED,
	ENABLED
}

//##############################################################################
//#region                             NODE
//##############################################################################

export class FcNode extends FlowchartNode<FcNodeId, TsukihimeFlowchart> {
	column: number
	_align: FcNodeId | FcNode | null
	cutAt: number
	graph?: Graphics
	_boundRect: [number, number, number, number] | null = null
	_state: number = -1
	_navY: number | null

	constructor(id: FcNodeId, {col, cutAt, graph, align, ...attrs}: FcNodeAttrs,
				flowchart: TsukihimeFlowchart, ) {
		super(id, attrs, flowchart)
		this.column = col
		this.cutAt = cutAt ?? 0
		this.graph = graph
		this._align = align ?? null
		this._navY = null
	}
	
	get navY() {
		if (!this.scene || this.state < FcNodeState.ENABLED)
			return null
		if (this._navY != null)
			return this._navY
		const parentSceneNodes = this.parentSceneNodes
		if (parentSceneNodes.length == 0)
			return 0
		const max: number = parentSceneNodes.reduce((max, n)=> {
			return Math.max(max, n.navY as number)
		}, 0)
		this._navY = max+1
		return this._navY
	}
	
	get parentSceneNodes() {
		const parents: this[] = new Array(...this.parents)
		let i = 0
		while (i < parents.length) {
			const node = parents[i]
			if (!node.scene)
				parents.splice(i, 1, ...node.parents)
			else
				i++
		}
		return parents
	}
	get flowchart(): TsukihimeFlowchart {
		return super.flowchart
	}
	get alignedNode(): FcNode|null {
		if (this._align && !(this._align instanceof FcNode))
			this._align = this.flowchart.getNode(this._align) as FcNode
		return (this._align as FcNode|null) ?? null
	}
	get scene(): boolean {
		return isScene(this.id)
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
		if (this._state == -1) {
			if (isThScene(this.id)) {
				if (this.flowchart.isSceneEnabled(this.id))
					this._state = FcNodeState.ENABLED
				else if (this.seen)
					this._state = FcNodeState.DISABLED
				else if (this.parents.some(p=>p.seen))
					this._state = FcNodeState.UNSEEN
				else
					this._state = FcNodeState.UNSEEN
					// this._state = FcNodeState.HIDDEN
			}
			else {
				this._state = Math.max(FcNodeState.HIDDEN,
					...this.parents.map(node => node.state))
			}
		}
		return this._state
	}

	get visible(): boolean {
		return true
		// return this.state > FcNodeState.HIDDEN
	}
	
	get metadatas() {
		const metadatas = this.flowchart.metadatas
		if (!Object.hasOwn(metadatas.i, this.id))
			debugger;
		const [top, left, fileIndex] = metadatas.i[this.id]
		const { w: width, h: height } = metadatas.d
		return {
			file: spriteSheetImgPath(metadatas.f[fileIndex]),
			left, top, width, height,
		}
	}
	get boundingRect(): [number, number, number, number] {
		if (this._boundRect == null) {
			const x = this.column * COLUMN_WIDTH
			let top
			if (this.alignedNode && this.alignedNode.visible)
				top = this.alignedNode.top
			else if (this.parents.length > 0)
				top = Math.max(0, ...this.parents.map(node => node.bottom)) + (this.visible ? DY*2 : 0)
			else
				top = 0
			if (this.scene && this.visible)
				this._boundRect = [x - SCENE_WIDTH/2, top,
								   SCENE_WIDTH, SCENE_HEIGHT]
			else
				this._boundRect = [x, top, 0, 0]
		}
		return this._boundRect
	}
	get left()  : number { return this.boundingRect[0] }
	get top()   : number { return this.boundingRect[1] }
	get width() : number { return this.boundingRect[2] }
	get height(): number { return this.boundingRect[3] }
	get right() : number { return this.left + this.width }
	get bottom(): number { return this.top + this.height }
	get centerX(): number { return this.left + this.width/2 }
	get centerY(): number { return this.top + this.height/2 }

	invalidate() {
		this._boundRect = null
		this._state = -1
	}
}


type Connection = { from: FcNode; to: FcNode }

export function buildConnections(visibleNodes: FcNode[]): Connection[] {
	const disabled: Connection[] = []
	const enabled: Connection[] = []

	for (const node of visibleNodes) {
		for (const parent of node.parents) {
			const isDisabled =
				parent.state === FcNodeState.DISABLED ||
				node.state === FcNodeState.DISABLED;

			(isDisabled ? disabled : enabled).push({ from: parent, to: node })
		}
	}

	return [...disabled, ...enabled] // disabled first = rendered under enabled
}