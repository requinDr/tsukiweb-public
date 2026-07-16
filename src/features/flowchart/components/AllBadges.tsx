import { FcNode } from "features/flowchart/utils/flowchart"
import { FcNodeState } from "@tsukiweb-common/flowchart"
import { SceneBadges } from "./SceneBadges"
import { isLanguageLoaded, useStrings } from "translation/lang";

type Props = {
	nodes: FcNode[]
}

const AllBadges = ({ nodes }: Props) => {
	useStrings()
	if (!isLanguageLoaded())
		return null
	const activeNodes = nodes.filter(n =>
		n.scene && n.state !== FcNodeState.UNSEEN && n.state !== FcNodeState.HIDDEN)
	return (
		<>
			{activeNodes.map(node => <SceneBadges key={node.id} node={node} />)}
		</>
	)
	
}

export default AllBadges
