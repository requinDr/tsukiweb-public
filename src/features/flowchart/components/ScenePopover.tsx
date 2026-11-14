import { GraphicsGroup } from "@tsukiweb/common/graphics"
import { noBb, Bbcode } from "@tsukiweb/common/utils/Bbcode"
import { CharId, SceneName } from "app/utils/types"
import classNames from "classnames"
import { FcNode, GameFlowchart } from "features/flowchart/utils/flowchart"
import { tokenizeCondition } from "@tsukiweb/common/script/utils"
import { settings } from "engine/settings"
import { BadgeEntry, getNodeBadges } from "features/flowchart/utils/badges";
import { getSceneGraph } from "engine/utils";
import { FlagBadge } from "@tsukiweb/common/icons/badges";
import { CharPointBadge, RouteBadge } from "./badges";


const TokenDisplay = ({ token }: { token: string }) => {
	switch (token) {
		case '&&' : return <span className="separator">&amp;</span>
		case '||' : return <span>/</span>
		case '>=' : return <span>&ge;</span>
		case '<=' : return <span>&le;</span>
		case '==' : return <span>=</span>
		case '!=' : return <span>&ne;</span>
		default : return <span>{token}</span>
	}
}

const SceneCondition = ({condition}: {condition: string})=> {
	return tokenizeCondition(condition).map((token, i, tokens)=> {
		if (token.length == 0) return null
		if (token == '!') return null
		if (!token.startsWith('%'))
			return <TokenDisplay key={i} token={token} /> // operator or number
		if (token.startsWith('%regard')) {
			const char = token.split('_')[1]
			return <CharPointBadge key={i} char={char as CharId} />
		}
		else if (token.startsWith('%flg')) {
			const flag = token.charAt(4)
			const negative = (i > 0 && (tokens[i-1] == '!'))
			return <FlagBadge key={i} icon={flag} negative={negative} />
		}
		else if (token.startsWith('%clear')) {
			let char: string | null
			if (token == '%cleared')
				char = null;
			else
				char = token.split('_')[1]
			return <RouteBadge key={i} char={char as CharId | null} />
		}
	})
}

const SceneIllustration = ({node}: {node: FcNode})=> {
	const graph = node.scene ? getSceneGraph(node.id as SceneName) : null
	return <>
		<div className="background">
			{graph && <GraphicsGroup key={node.id} images={graph} />}
		</div>
		<div className="desc">
			<div className="title">
			{node.displayName.split('[br/]').map((line, i) =>
				<div key={i}>{noBb(line)}</div>)
			}
			</div>
			<div className="id">
				{node.id.replace("openning", "opening")}
			</div>
		</div>
	</>
}

const SceneBadges = ({badges}: {badges: BadgeEntry})=> {
	if (!badges) return null

	let {condition, flag, char, value, ending} = badges
	if (typeof condition == "object")
		condition = condition.condition

	return <>
		{condition &&
			<div className="condition">
				<SceneCondition condition={condition}/>
			</div>
		}

		{(flag || (char && value != null) || ending) &&
			<div className="badges">
				{flag && <FlagBadge icon={flag} />}
				{char && value != null && <CharPointBadge char={char} value={value} />}
				{ending && <RouteBadge char={ending.char} />}
			</div>
		}
	</>
}

const SceneChoices = ({select, choice = -1}: {select: BadgeEntry['select'], choice: number })=> {
	if (!select) return null

	return (
		<div className="choices-container">
			{select.map(({text, condition}, i) =>
				<div key={i} className={classNames("choice", {selected: i == choice})} >
					{settings.flowchartBadges && condition &&
						<div className="condition">
							<SceneCondition condition={condition}/>
						</div>
					}
					<Bbcode text={text} />
				</div>
			)}
		</div>
	)
}

type PopoverProps = {
	node: FcNode
	flowchart: GameFlowchart
}
const ScenePopover = ({ node, flowchart }: PopoverProps) => {
	const badges = getNodeBadges(node.id)

	return (
		<div className="scene-popover-content">
			<div className="scoop">
				<SceneIllustration node={node} />
			</div>
			{badges && <SceneChoices select={badges.select} choice={flowchart.getHistoryScene(node.id)?.choice ?? -1}/>}
			{settings.flowchartBadges && badges &&
				<SceneBadges badges={badges} />
			}
		</div>
	)
}

export default ScenePopover
