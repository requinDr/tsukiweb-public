import { GraphicsGroup } from "@tsukiweb-common/graphics"
import { bb } from "@tsukiweb-common/utils/Bbcode"
import { SceneName } from "types"
import { FcNode, getSceneGraph } from "utils/flowchart"
import { getNodeBadges } from "./badges"

type PopoverProps = {
	node: FcNode
}
const ScenePopover = ({ node }: PopoverProps) => {
	const graph = node.scene ? getSceneGraph(node.id as SceneName) : null

	const badges = getNodeBadges(node.id)
	return (
		<div className="scene-popover-content">
			<div className="background">
				{graph && <GraphicsGroup images={graph} />}
			</div>
			<div className="title">
				{bb(node.displayName)}
			</div>
			<div className="id">
				{bb(node.id)}
			</div>
			{badges &&
				<svg className="badges" viewBox="-4 -4 50 8" preserveAspectRatio="xMinYMid meet">
					{badges.flag && 
						<g className="badge">
							<use href="#flag-icon"/>
							<text y="1.6" stroke="none" fill="white" textAnchor="middle">
								{badges.flag}
							</text>
						</g>
					}
					{badges.char &&
						[...Array(Math.abs(badges.value)).fill(0)].map((_, i)=> 
						<use key={i} className="badge" href={`#regard_${Math.sign(badges.value)}`}
							fill={`url(#${badges.char}_grad)`}
							transform={`translate(${8*(i+(badges.flag ? 1 : 0))}, 0)`}
							/>
						)
					}
				</svg>
			}
		</div>
	)
}

export default ScenePopover