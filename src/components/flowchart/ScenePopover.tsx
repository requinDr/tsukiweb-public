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
						<g className="badge" transform={`translate(${badges.flag ? 4 : -4},0)`}>
							<image href={`./chars/${badges.char}.webp`}
									className="badge" x={1} y={-3.5} height={7}/>
							{[...Array(Math.abs(badges.value)).fill(0)].map((_, i)=> 
							<use key={i} href={`#regard_${Math.sign(badges.value)}`}
								fill={`url(#${badges.char}_grad)`}
								transform={`translate(${11+5*i},0) scale(0.75)`}
								/>
							)}
						</g>
					}
				</svg>
			}
		</div>
	)
}

export default ScenePopover