import { memo, useCallback, useMemo } from "react"
import { FcNode, GameFlowchart } from "features/flowchart/utils/flowchart"
import { LabelName, SceneName } from "app/utils/types"
import { History } from "engine/history"
import { computeLinks, FcCanvasItem, FcNodeState, FlowchartCanvas, flowchartBounds } from "@tsukiweb/common/flowchart"
import ScenePopover from "./ScenePopover"
import { BADGES_DEFINES } from "./badges"
import { createBadgesDrawer } from "../utils/badgesCanvas"
import { settings } from "engine/settings"
import { getSceneGraph } from "engine/utils"
import cg from "features/gallery/utils/gallery"
import { isLanguageLoaded, useStrings } from "translation/lang"

type Props = {
	history?: History,
	onSceneClick?: (id: SceneName) => void,
	mode?: 'playthrough' | 'viewer'
	/** scene centered when opened, if different from the last scene of `history` */
	currentScene?: LabelName
}

function buildItems(nodes: FcNode[], currentNode?: FcNode): FcCanvasItem<FcNode>[] {
	const refX = currentNode?.column ?? 0
	const refY = currentNode?.navY ?? 0
	return nodes.flatMap((node): FcCanvasItem<FcNode>[] => {
		if (!node.scene || node.state == FcNodeState.HIDDEN)
			return []
		if (node.state == FcNodeState.UNSEEN)
			return [{ node, kind: 'hidden' }]
		const graph = getSceneGraph(node.id as SceneName)
		const inProgress = node.active && !node.seen
		const { file, left, top, width, height } = node.metadatas
		return [{
			node,
			kind: file ? 'image' : 'box',
			thumbnail: file ? { file, source: [left, top, width, height] } : undefined,
			blur: inProgress || !!(graph.bg && cg.shouldBlur(graph.bg)),
			disabled: node.state == FcNodeState.DISABLED,
			group: node.group,
			popover: !inProgress,
			nav: node.navY != null ? { x: node.column - refX, y: node.navY - refY } : undefined,
		}]
	})
}

const Flowchart = ({history, onSceneClick, mode = 'viewer', currentScene}: Props) => {
	const strings = useStrings()
	const flowchart = useMemo(() => new GameFlowchart(history), [history])
	const nodes = useMemo(() => flowchart.listNodes().filter(n => n.visible), [flowchart])
	const currentNode = flowchart.getNode(currentScene ?? flowchart.activeScene)
	const items = useMemo(() => buildItems(nodes, currentNode), [nodes])
	const bounds = useMemo(() => flowchartBounds(nodes), [nodes])
	const links = useMemo(() => computeLinks(nodes, (parent, node) =>
		flowchart.isLinkDisabled(parent, node, mode)), [nodes, mode])

	const languageKey = isLanguageLoaded() ? `${strings.id}:${strings.lastUpdate ?? ""}` : ""
	const drawBadges = useMemo(() => settings.flowchartBadges && languageKey
		? createBadgesDrawer(items.filter(item => item.kind != 'hidden').map(item => item.node))
		: undefined,
	[items, languageKey])

	const onSelect = useCallback((node: FcNode) =>
		onSceneClick?.(node.id as SceneName), [onSceneClick])

	return <>
		<svg className="fc-defs">{BADGES_DEFINES}</svg>
		<FlowchartCanvas
			items={items}
			links={links}
			bounds={bounds}
			center={currentNode?.scene ? currentNode : undefined}
			onSelect={onSelect}
			renderPopover={node => <ScenePopover node={node} />}
			drawOverlay={drawBadges}
		/>
	</>
}

export default memo(Flowchart)
