
import { Fragment, memo, useState } from "react"
import '../styles/flowchart.scss'
import { Graphics, SceneName } from "../types"
import { SCENE_ATTRS } from "../utils/constants"
import { isScene } from "../utils/scriptUtils"
import { graphicElements } from "./GraphicsComponent"
import { settings } from "../utils/variables"

const SCENE_WIDTH = 27
const SCENE_HEIGHT = 18
const COLUMN_WIDTH = SCENE_WIDTH+3
const DY = 3

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

class FcNode {
  column: number;
  y: number;
  id: string;
  from: FcNode[];
  constructor(id: string, column: number, from: FcNode[], alignedNode?: FcNode) {
    this.id = id
    this.column = column
    this.from = from
    this.y = alignedNode ? alignedNode.top
           : from.reduce((yMax, node)=> Math.max(node.bottom, yMax), 0) + DY*2

  }

  get x()       { return this.column * COLUMN_WIDTH }
  get width()   { return 0 }
  get height()  { return 0 }
  get top()     { return this.y - this.height/2 }
  get bottom()  { return this.y + this.height/2 }
  get left()    { return this.x - this.width/2 }
  get right()   { return this.x + this.width/2 }

  render(): React.ReactNode {
    return this.from.map(node=> {
      const id = `${node.id}-${this.id}`
      const yStart = node.bottom
      const yEnd = this.top
      let path = `M ${node.x},${yStart}`
      if (node.column == this.column)
        path += ` V ${yEnd}`
      else if (yStart == yEnd)
        path += ` H ${this.x}`
      else {
        const turnY = yEnd - DY
        if (turnY > yStart)
          path += ` V ${turnY}`
        path +=` H ${this.x} V ${yEnd}`
      }
      return <path key={id} className="fc-link" id={id} d={path}/>
    })
  }
}

class FcScene extends FcNode {
  graph: Graphics|undefined
  constructor(id: SceneName, column: number, from: FcNode[], alignedNode?: FcNode, graph ?: Graphics) {
    super(id, column, from, alignedNode)
    this.y += SCENE_HEIGHT/2
    this.graph = graph
  }

  get width()   { return SCENE_WIDTH }
  get height()  { return SCENE_HEIGHT }

  render() {
    let content
    if (!settings.completedScenes.includes(this.id))
      content = <use href="#fc-scene-hidden"/>
    else if (!this.graph)
      content = <>
        <use href="#fc-scene-background" />
        <text className="fc-scene-title">{this.id}</text>
      </>
    else
      content = <foreignObject x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2}
        width={SCENE_WIDTH} height={SCENE_HEIGHT}>
        <div className="graphics">
          {graphicElements(this.graph, {}, 'sd')}
        </div>
      </foreignObject>
    
    return <Fragment key={this.id}>
      {super.render()}
      <g className="fc-scene" id={this.id}
        transform={`translate(${this.x},${this.y})`}
        clipPath="url(#fc-scene-clip)">
        {content}
        <use href="#fc-scene-outline"/>
      </g>
    </Fragment>
  }
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
class FcNodeParams {
  id: string
  column: number
  from: string[]
  align: string|undefined
  constructor(id: string, column: number, from: string[], align?: string) {
    this.id = id
    this.column = column
    this.from = from
    this.align = align
  }
  build(nodes: Map<string, FcNode|FcNodeParams>) {
    const parentNodes = this.from.map(getNode.bind(null, nodes))
    const alignedNode = this.align ? getNode(nodes, this.align) : undefined
    nodes.set(this.id, this.construct(parentNodes, alignedNode))
  }
  construct(parentNodes: FcNode[], alignedNode: FcNode|undefined) {
    return new FcNode(this.id, this.column, parentNodes, alignedNode)
  }
}

class FcSceneParams extends FcNodeParams {
  graph: Graphics|undefined
  constructor(id: SceneName, column: number, from: string[], align?: string, graph?: Graphics) {
    super(id, column, from, align)
    this.graph = graph
  }
  construct(parentNodes: FcNode[], alignedNode: FcNode|undefined) {
    return new FcScene(this.id as SceneName, this.column, parentNodes, alignedNode, this.graph)
  }
}

function createTree() {
  let tree = new Map<string, FcNodeParams|FcNode>()
  Object.entries(SCENE_ATTRS.scenes).forEach(([id, {fc}])=> {
    if (fc) {
      let {col, from, align, graph} = fc
      tree.set(id, new FcSceneParams(id as SceneName, col, from, align, graph))
    }
  })
  Object.entries(SCENE_ATTRS["fc-nodes"]??{}).forEach(([id, {col, from, align}])=> {
    tree.set(id, new FcNodeParams(id, col, from, align))
  })
  for (const node of tree.values()) {
    if (node instanceof FcNodeParams) {
      node.build(tree)
    }
  }
  return Array.from(tree.values()) as FcNode[]
}

type Props = {
  back: (sceneLoaded: boolean)=>void
}
export const Flowchart = memo(({back}: Props)=> {
  const [tree] = useState<FcNode[]>(createTree)
  const viewBox = tree.reduce((vb, node)=> [
    Math.min(vb[0], node.left),
    Math.min(vb[1], node.top),
    Math.max(vb[2], node.right),
    Math.max(vb[3], node.bottom),
  ], [Number.MAX_VALUE, Number.MAX_VALUE, 0, 0])
  viewBox[2] -= viewBox[0]
  viewBox[3] -= viewBox[1]

  return <div className="flowchart">
    <svg viewBox={viewBox.join(" ")}
      version="1.1"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hidden-scene-gradient">
            <stop offset="0%" stop-color="black" />
            <stop offset="50%" stop-color="#111" />
            <stop offset="95%" stop-color="#222" />
        </radialGradient>
        <rect id="fc-scene-outline"
            fill="transparent" stroke="rgb(115 115 115)"
            style={{strokeWidth: 0.4, strokeLinejoin: 'round'}}
            width={SCENE_WIDTH} height={SCENE_HEIGHT}
            x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2} rx={SCENE_HEIGHT/10} />
        <rect id="fc-scene-background"
            fill="rgb(67 67 67)"
            width={SCENE_WIDTH} height={SCENE_HEIGHT}
            x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2} />
        <g id="fc-scene-hidden">
          <rect width={SCENE_WIDTH} height={SCENE_HEIGHT}
              x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2}
              fill="url(#hidden-scene-gradient)" />
          <line x1={-SCENE_WIDTH/2} y1={-SCENE_HEIGHT/2} stroke="black"
                x2={ SCENE_WIDTH/2} y2={ SCENE_HEIGHT/2} strokeWidth={0.4}/>
          <line x1={-SCENE_WIDTH/2} y1={ SCENE_HEIGHT/2} stroke="black"
                x2={ SCENE_WIDTH/2} y2={-SCENE_HEIGHT/2} strokeWidth={0.4}/>
        </g>
      </defs>
      <clipPath id="fc-scene-clip">
        <use href="#fc-scene-outline"/>
      </clipPath>
      {tree.map(node=> node.render())}
    </svg>
    {/*<FlowchartSVG/>*/}
  </div>
})