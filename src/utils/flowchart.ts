import { FcNode } from "components/flowchart/FcNode"
import { FcScene } from "components/flowchart/FcScene"
import { isScene } from "./scriptUtils"
import { SceneName } from "types"
import { SCENE_ATTRS } from "./constants"
import { Graphics } from "@tsukiweb-common/types"

export const SCENE_WIDTH = 27
export const SCENE_HEIGHT = 18
export const COLUMN_WIDTH = SCENE_WIDTH + 3
export const DY = 3
export const OVERLAP_BREAK_LENGTH = 2

export const SCENE_RECT_ATTRS = {
	width: SCENE_WIDTH,
	height: SCENE_HEIGHT,
	x: -SCENE_WIDTH/2,
	y: -SCENE_HEIGHT/2
}

class FcNodeParams {
	id: string
	column: number
	from: string[]
	align: string|undefined
	cutAt: number|undefined
	constructor(id: string, column: number, from: string[], align?: string, cutAt?: number) {
		this.id = id
		this.column = column
		this.from = from
		this.align = align
		this.cutAt = cutAt
	}
	build(nodes: Map<string, FcNode|FcNodeParams>) {
		const parentNodes = this.from.map(getNode.bind(null, nodes))
		const alignedNode = this.align ? getNode(nodes, this.align) : undefined
		nodes.set(this.id, this.construct(parentNodes, alignedNode))
	}
	construct(parentNodes: FcNode[], alignedNode: FcNode|undefined) {
		return new FcNode(this.id, this.column, parentNodes, alignedNode, this.cutAt)
	}
}

class FcSceneParams extends FcNodeParams {
	graph: Graphics|undefined
	constructor(id: SceneName, column: number, from: string[], align?: string, graph?: Graphics, cutAt?: number) {
		super(id, column, from, align, cutAt)
		this.graph = graph
	}
	construct(parentNodes: FcNode[], alignedNode: FcNode|undefined) {
		return new FcScene(this.id as SceneName, this.column, parentNodes, alignedNode, this.graph, this.cutAt)
	}
}

export function createTree() {
	let tree = new Map<string, FcNodeParams|FcNode>()
	Object.entries(SCENE_ATTRS.scenes).forEach(([id, {fc}])=> {
		if (fc) {
			let {col, from, align, graph, cutAt} = fc
			tree.set(id, new FcSceneParams(id as SceneName, col, from, align, graph, cutAt))
		}
	})
	Object.entries(SCENE_ATTRS["fc-nodes"]??{}).forEach(([id, {col, from, align, cutAt}])=> {
		tree.set(id, new FcNodeParams(id, col, from, align, cutAt))
	})
	for (const node of tree.values()) {
		if (node instanceof FcNodeParams) {
			node.build(tree)
		}
	}
	return Array.from(tree.values()) as FcNode[]
}

function getPreviousScenes(tree: Map<string, FcNodeParams|FcNode>, scene: string): string[] {
	const currNode = tree.get(scene)
	if (!currNode)
		throw Error(`unknown flowchart node ${scene}`)
	const from = currNode.from
	const result = []
	for (const node of from) {
		if (node instanceof FcScene)
			result.push(node.id)
		else if (node instanceof FcNode)
			result.push(...getPreviousScenes(tree, node.id))
		else if (isScene(node))
			result.push(node)
		else
			result.push(...getPreviousScenes(tree, node))
	}
	return result
	//TODO used to determine if a scene must be displayed (greyed out) if it hasn't been seen yet. (i.e., yes if one of the previous scenes has been seen)
}

function getNode(nodes: Map<string, FcNode|FcNodeParams>, id: string) {
	let node = nodes.get(id)
	if (!node)
		throw Error(`unknown node id ${id}`)
	if (node instanceof FcNodeParams) {
		node.build(nodes)
		node = nodes.get(id)
	}
	return node as FcNode
}