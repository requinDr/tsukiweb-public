import GraphicsGroup from "@tsukiweb-common/graphics/GraphicsGroup"
import { Bbcode, closeBB } from "@tsukiweb-common/utils/Bbcode"
import { FcNode } from "utils/flowchart"

type PopoverProps = {
	node: FcNode,
}
const ScenePopover = ({ node }: PopoverProps) => {

	return (
		<div className="scene-popover-content">
			<div className="header">
				<GraphicsGroup images={node.graph ?? {bg:"#000"}} />
			</div>
			<div className="title">
				<Bbcode text={node.displayName}/><br/>
			</div>
			<div className="id">
				<Bbcode text={node.id}/><br/>
			</div>
		</div>
	)
}

export default ScenePopover