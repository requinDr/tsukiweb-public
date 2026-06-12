import { GraphicsGroup } from "@tsukiweb-common/graphics"
import { noBb, Bbcode } from "@tsukiweb-common/utils/Bbcode"
import { SceneName } from "app/utils/types"
import { FcNode, getSceneGraph } from "features/flowchart/utils/flowchart"
import { tokenizeCondition } from "@tsukiweb-common/script/utils"
import { settings } from "engine/settings"
import { BadgeEntry, getNodeBadges } from "features/flowchart/utils/badges";


const RegardBadge = ({char}: {char: string}) => {
	return (
		<svg className="badge" viewBox="-13 -3.4 13 7">
			<image href={`./res/chars/${char}.webp`}
				className="badge"
				x={-13} y={-3.5} height={7} />
			<use href="#regard_heart"
				fill={`url(#${char}_grad)`}
				transform="translate(-3.5,0.5) scale(0.75)"/>
		</svg>
	)
}

const FlagBadge = ({flag, negative}: {flag: string, negative?: boolean}) => {
	return (
		<svg className="badge" viewBox="-3.5 -3.5 7 7">
			<use href={negative ? "#flag-neg-icon" : "#flag-icon"}/>
			<text y="1.6" stroke="none" fill="white" textAnchor="middle">
				{flag}
			</text>
		</svg>
	)
}

const EndingBadge = ({char}: {char: string | null}) => {
	return (
		<svg className="badge" viewBox={`0 -3.4 ${char ? 13 : 6} 7`}>
			<image href={`./res/chars/${char}.webp`}
				className="badge"
				x={0} y={-3.5} height={7} />
			<use className="badge" href="#route_icon"
				fill={char ? `url(#${char}_grad)` : '#FFF'}
				transform={`translate(${char ? 10 : 3},0) scale(0.75)`}/>
		</svg>
	)
}

const RegardValueBadge = ({ char, value }: { char: string; value: number }) => {
	const abs = Math.abs(value)
	const sign = Math.sign(value)
	return (
		<svg className="badge" viewBox={`${-(abs * 5 + 8)} -3.5 ${abs * 5 + 8} 7`}>
			<image
				href={`./res/chars/${char}.webp`}
				className="badge"
				x={-(abs * 5 + 8)}
				y={-3.5}
				height={7}
			/>
			{[...Array(abs)].map((_, i) => (
				<use
					key={i}
					href={`#regard_${sign}`}
					fill={`url(#${char}_grad)`}
					transform={`translate(${-(abs - i) * 5 + 1.5},0) scale(0.75)`}
				/>
			))}
		</svg>
	)
}

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
			return <RegardBadge key={i} char={char} />
		}
		else if (token.startsWith('%flg')) {
			const flag = token.charAt(4)
			const negative = (i > 0 && (tokens[i-1] == '!'))
			return <FlagBadge key={i} flag={flag} negative={negative} />
		}
		else if (token.startsWith('%clear')) {
			let char: string | null
			if (token == '%cleared')
				char = null;
			else
				char = token.split('_')[1]
			return <EndingBadge key={i} char={char} />
		}
	})
}

const SceneIllustration = ({node}: {node: FcNode})=> {
	const graph = node.scene ? getSceneGraph(node.id as SceneName) : null
	return <>
		<div className="background">
			{graph && <GraphicsGroup images={graph} />}
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
				{flag && <FlagBadge flag={flag} />}
				{char && value != null && <RegardValueBadge char={char} value={value} />}
				{ending && <EndingBadge char={ending.char} />}
			</div>
		}
	</>
}

const SceneChoices = ({select}: {select: BadgeEntry['select'] })=> {
	if (!select) return null

	return (
		<div className="choices-container">
			{select.map(({text, condition}, i) =>
				<div key={i} className="choice">
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
}
const ScenePopover = ({ node }: PopoverProps) => {
	const badges = getNodeBadges(node.id)

	return (
		<div className="scene-popover-content">
			<div className="scoop">
				<SceneIllustration node={node} />
			</div>
			{badges && <SceneChoices select={badges.select} />}
			{settings.flowchartBadges && badges &&
				<SceneBadges badges={badges} />
			}
		</div>
	)
}

export default ScenePopover
