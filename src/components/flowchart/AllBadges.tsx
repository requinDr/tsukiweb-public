import { FcNode } from "utils/flowchart"
import { FcNodeState } from "@tsukiweb-common/flowchart"
import { SceneBadges } from "./SceneBadges"

type Props = {
	nodes: FcNode[]
}

const AllBadges = ({ nodes }: Props) => {
	const activeNodes = nodes.filter(n =>
		n.scene && n.state !== FcNodeState.UNSEEN && n.state !== FcNodeState.HIDDEN)

	return (
		<>
			{activeNodes.map(node => <SceneBadges key={node.id} node={node} />)}
		</>
	)
}

export default AllBadges
