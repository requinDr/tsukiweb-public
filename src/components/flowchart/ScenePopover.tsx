import { GraphicsGroup } from "@tsukiweb-common/graphics"
import { bb } from "@tsukiweb-common/utils/Bbcode"
import { FcNode } from "utils/flowchart"

type PopoverProps = {
	node: FcNode
}
const ScenePopover = ({ node }: PopoverProps) => {

	return (
		<div className="scene-popover-content">
			<div className="background">
				{node.graph && <GraphicsGroup images={node.graph} />}
			</div>
			<div className="title">
				{bb(node.displayName)}
			</div>
			<div className="id">
				{bb(node.id)}
			</div>
		</div>
	)
}

export default ScenePopover