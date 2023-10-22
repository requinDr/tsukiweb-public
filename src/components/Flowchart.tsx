
import { Fragment, memo, useState } from "react"
import '../styles/flowchart.scss'
import { Graphics, SceneName } from "../types"
import { SCENE_ATTRS } from "../utils/constants"
import { getSceneTitle } from "../utils/scriptUtils"
import { Bbcode } from "../utils/Bbcode"
import { graphicElements } from "./GraphicsComponent"

const SCENE_WIDTH = 27
const SCENE_HEIGHT = 18
const COLUMN_WIDTH = SCENE_WIDTH+3
const DY = 3

class FcNode {
  column: number;
  y: number;
  dY: number;
  id: string;
  from: FcNode[];
  constructor(id: string, column: number, from: FcNode[], dY: number = DY) {
    this.id = id
    this.column = column
    this.from = from
    this.y = from.reduce((yMax, node)=>
    Math.max(node.bottom, yMax), 0) + DY + dY
    this.dY = dY
  }
  get top() {
    return this.y
  }
  get bottom() {
    return this.y
  }
  get x() {
    return this.column * COLUMN_WIDTH
  }

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
        const turnY = yEnd - this.dY
        if (turnY > yStart)
          path += ` V ${turnY}`
        path +=` H ${this.x}`
        if (this.dY > 0)
          path += `V ${yEnd}`
      }
      return <path key={id} className="fc-link" id={id} d={path}/>
    })
  }
}

class FcScene extends FcNode {
  graph: Graphics|undefined
  constructor(id: SceneName, column: number, from: FcNode[], dY = DY, graph ?: Graphics) {
    super(id, column, from, dY)
    this.y += SCENE_HEIGHT/2
    this.graph = graph
  }

  get top() {
    return this.y - SCENE_HEIGHT/2
  }
  get bottom() {
    return this.y + SCENE_HEIGHT/2
  }

  render() {
    return <Fragment key={this.id}>
      {super.render()}
      <g className="fc-scene" id={this.id}
        transform={`translate(${this.x},${this.y})`}>
        <use href="#fc-scene-outline-rect"/>
        { this.graph &&
          <foreignObject x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2} width={SCENE_WIDTH} height={SCENE_HEIGHT}>
            {graphicElements(this.graph, {}, 'sd')}
          </foreignObject>
        || <text className="fc-scene-title">{this.id}</text>
        }
      </g>
    </Fragment>
  }
}

class FcNodeParams {
  id: string
  column: number
  from: string[]
  dy: number
  constructor(id: string, column: number, from: string[], dy: number = DY) {
    this.id = id
    this.column = column
    this.from = from
    this.dy = dy
  }
  build(nodes: Map<string, FcNode|FcNodeParams>) {
    const parentNodes = this.from.map(id=> {
      let node = nodes.get(id)
      if (!node)
        throw Error(`unknown node id ${id} (parent of ${this.id})`)
      if (node instanceof FcNodeParams) {
        node.build(nodes)
        node = nodes.get(id)
      }
      return node as FcNode
    })
    nodes.set(this.id, this.construct(parentNodes))
  }
  construct(parentNodes: FcNode[]) {
    return new FcNode(this.id, this.column, parentNodes, this.dy)
  }
}

class FcSceneParams extends FcNodeParams {
  graph: Graphics|undefined
  constructor(id: SceneName, column: number, from: string[], dy: number = DY, graph?: Graphics) {
    super(id, column, from, dy)
    this.graph = graph
  }
  construct(parentNodes: FcNode[]) {
    return new FcScene(this.id as SceneName, this.column, parentNodes, this.dy, this.graph)
  }
}

function createTree() {
  let tree = new Map<string, FcNodeParams|FcNode>()
  Object.entries(SCENE_ATTRS.scenes).forEach(([id, {fc}])=> {
    if (fc) {
      let {col, from, dy, graph} = fc
      if (dy) dy *= DY
      tree.set(id, new FcSceneParams(id as SceneName, col, from, dy, graph))
    }
  })
  Object.entries(SCENE_ATTRS["fc-nodes"]??{}).forEach(([id, {col, from, dy}])=> {
    if (dy) dy *= DY
    tree.set(id, new FcNodeParams(id, col, from, dy))
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
  return <div style={{overflow:"scroll"}}>
    <svg width="400mm" height="600mm"
      viewBox="-50 -50 400 600"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg">
      <defs>
        <rect
            style={{fill:'#787878', stroke:'#000000',
                    strokeWidth:0.3, strokeLinejoin: 'round'}}
            id="fc-scene-outline-rect"
            width={SCENE_WIDTH}
            height={SCENE_HEIGHT}
            x={-SCENE_WIDTH/2}
            y={-SCENE_HEIGHT/2} />
      </defs>
      {tree.map(node=> node.render())}
    </svg>
    {/*<FlowchartSVG/>*/}
  </div>
})