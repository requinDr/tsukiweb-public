import GraphicsGroup from "@tsukiweb-common/graphics/GraphicsGroup"
import { Graphics } from "@tsukiweb-common/types"
import { Bbcode } from "@tsukiweb-common/utils/Bbcode"

type PopoverProps = {
	graphics?: Partial<Graphics>
	nodeId: string
	displayName: string
}
const ScenePopover = ({ graphics, displayName, nodeId }: PopoverProps) => {
	return (
		<div className="scene-popover-content">
			<div className="header">
				<GraphicsGroup images={graphics ?? {bg:"#000"}} />
			</div>
			<div className="title">
				<Bbcode text={displayName}/><br/>
			</div>
			<div className="id">
				<Bbcode text={nodeId}/><br/>
			</div>
		</div>
	)
}

export default ScenePopover