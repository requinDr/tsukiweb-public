import { GraphicsGroup } from "@tsukiweb-common/graphics"
import { bb, noBb } from "@tsukiweb-common/utils/Bbcode"
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
				{node.displayName.split('[br/]')
					.map((line, i) => <div key={i}>{noBb(line)}</div>)}
			</div>
			<div className="id">
				{bb(node.id)}
			</div>
			{badges &&
				<svg className="badges" viewBox="-50 -4 56 8" preserveAspectRatio="xMaxYMid meet">
					{badges.flag &&
						<g className="badge">
							<use href="#flag-icon"/>
							<text y="1.6" stroke="none" fill="white" textAnchor="middle">
								{badges.flag}
							</text>
						</g>
					}
					{badges.char &&
						<g className="badge" transform={`translate(${badges.flag ? -4 : 4},0)`}>
							{[...Array(Math.abs(badges.value)).fill(0)].map((_, i) =>
								<use key={i} href={`#regard_${Math.sign(badges.value)}`}
									fill={`url(#${badges.char}_grad)`}
									transform={`translate(${-(Math.abs(badges.value) - i) * 5},0) scale(0.75)`}
								/>
							)}
							<image href={`./chars/${badges.char}.webp`}
								className="badge"
								x={-(Math.abs(badges.value) * 5 + 8)}
								y={-3.5} height={7} />
						</g>
					}
				</svg>
			}
		</div>
	)
}

export default ScenePopover