import GraphicsGroup from "components/molecules/GraphicsGroup"
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
			<div className="content">
				{node.id}<br/>
			</div>
		</div>
	)
}

export default ScenePopover