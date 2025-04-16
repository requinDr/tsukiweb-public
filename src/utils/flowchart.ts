import { isScene, isThScene } from "./scriptUtils"
import { TsukihimeSceneName } from "types"
import { SCENE_ATTRS } from "./constants"
import { Graphics } from "@tsukiweb-common/types"
import { Flowchart, FlowchartNode, FlowchartNodeAttrs } from "@tsukiweb-common/utils/Flowchart"
import SpritesheetMetadata from "../assets/flowchart/spritesheet_metadata.json"
import { spriteSheetImgPath } from "translation/assets"
import { settings } from "./settings"
import { gameContext } from "./variables"
import { displayMode, SCREEN } from "./display"

//##############################################################################
//#region                       CONSTANTS & TYPES
//##############################################################################

export const SCENE_WIDTH = 31.5
export const SCENE_HEIGHT = 21
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
	constructor() {
		super({
			...(SCENE_ATTRS["fc-nodes"] ?? {}),
			...Object.fromEntries(Object.entries(SCENE_ATTRS.scenes)
					.map(([id, {fc}])=> [id, fc])
					.filter(([_id, fc])=> fc)) // filter non-fc scenes
		})
	}

	protected createNode(id: string, attrs: FcNodeAttrs): FcNode {
		return new FcNode(id, attrs, this)
	}

	isSceneEnabled(id: FcNodeId): boolean {
		if (displayMode.screen == SCREEN.WINDOW) {
			//TODO check if id is in history or is the active scene
			return this.activeScene == id
		} else {
			const node = this.getNode(id)
			return node != undefined && node.seen
		}
	}
	get activeScene(): FcNodeId {
		return gameContext.label
	}
}
export enum FcNodeState {
	HIDDEN,
	UNSEEN,
	DISABLED,
	ENABLED,
	ACTIVE,
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

	constructor(id: FcNodeId, {col, cutAt, graph, align, ...attrs}: FcNodeAttrs,
				flowchart: TsukihimeFlowchart, ) {
		super(id, attrs, flowchart)
		this.column = col
		this.cutAt = cutAt ?? 0
		this.graph = graph
		this._align = align ?? null
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

	get state(): FcNodeState {
		if (this._state == -1) {
			if (isThScene(this.id)) {
				if (this.flowchart.activeScene == this.id)
					this._state = FcNodeState.ACTIVE
				if (this.flowchart.isSceneEnabled(this.id))
					this._state = FcNodeState.ENABLED
				else if (this.seen)
					this._state = FcNodeState.DISABLED
				else if (this.parents.some(p=>p.state > FcNodeState.UNSEEN))
					this._state = FcNodeState.UNSEEN
				else
					this._state = FcNodeState.HIDDEN
			}
			else {
				this._state = Math.max(FcNodeState.HIDDEN,
					...this.parents.map(node => node.state))
			}
		}
		return this._state
	}

	get visible(): boolean {
		return this.state > FcNodeState.HIDDEN
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
				top = Math.max(...this.parents.filter(node => node.visible)
											  .map(node => node.bottom)) + DY*2
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