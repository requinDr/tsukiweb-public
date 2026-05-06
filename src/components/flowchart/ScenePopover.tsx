import { GraphicsGroup } from "@tsukiweb-common/graphics"
import { bb, noBb, Bbcode } from "@tsukiweb-common/utils/Bbcode"
import { SceneName } from "types"
import { FcNode, getSceneGraph } from "utils/flowchart"
import { getNodeBadges } from "./badges"
import { tokenizeCondition } from "@tsukiweb-common/script/utils"
import { splitLast } from "@tsukiweb-common/utils/utils"
import { settings } from "utils/settings"

type PopoverProps = {
	node: FcNode
}  
const SceneIllustration = ({node}: {node: FcNode})=> {
  const graph = node.scene ? getSceneGraph(node.id as SceneName) : null
  return <>
	<div className="background">
	  {graph && <GraphicsGroup images={graph} />}
	</div>
	<div className="desc">
	  <div className="title">
		{node.displayName.split('[br/]')
		  .map((line, i) => <div key={i}>{noBb(line)}</div>)}
	  </div>
	  <div className="id">
		{bb(node.id)}
	  </div>
	</div>
  </>
}
const SceneCondition = ({condition}: {condition: string})=> {
	return tokenizeCondition(condition).map((token, i, tokens)=> {
		if (token.length == 0) return null
		if (token == '!') return null
		if (!token.startsWith('%'))
			return <TokenDisplay key={token} token={token} /> // operator or number
		if (token.startsWith('%regard')) {
			const [, char] = splitLast(token, '_')
			return <svg key={i} className="badge" viewBox="-13 -3.4 13 7">
				<image href={`./chars/${char}.webp`}
					className="badge"
					x={-13} y={-3.5} height={7} />
				<use href="#regard_heart"
					fill={`url(#${char}_grad)`}
					transform="translate(-3.5,0) scale(0.75)"/>
			</svg>
		}
		else if (token.startsWith('%flg')) {
			const flag = token.charAt(4)
			const negative = (i > 0 && (tokens[i-1] == '!'))
			return <svg key={i} className="badge" viewBox="-3.5 -3.5 7 7">
				<use href={negative ? "#flag-neg-icon" : "#flag-icon"}/>
				<text y="1.6" stroke="none" fill="white" textAnchor="middle" fontSize={4}>
					{flag}
				</text>
			</svg>
		}
		else if (token.startsWith('%clear')) {
			let char
			switch (token) {
			case '%cleared': char = null; break
			case '%clear_ark': case '%clear_ark_true': char = 'ark'; break
			case '%clear_hisui': char="his"; break
			}
			return <svg key={i} className="badge" viewBox={`0 -3.4 ${char ? 13 : 6} 7`}>
				<image href={`./chars/${char}.webp`}
					className="badge"
					x={0} y={-3.5} height={7} />
				<use className="badge" href="#route_icon"
					fill={char ? `url(#ark_grad)` : '#FFF'}
					transform={`translate(${char ? 10 : 3},0) scale(0.75)`}/>
			</svg>
		}
	})
}
const SceneBadges = ({node}: {node: FcNode})=> {
	const badges = getNodeBadges(node.id)
	if (!badges) return null
	let {condition, flag, char, value, select} = badges
	if (typeof condition == "object")
		condition = condition.condition
	return <>
		{condition && <div className="condition">
			<SceneCondition condition={condition}/>
		</div>}

		<svg className="badges" viewBox="-50 -4 56 8" preserveAspectRatio="xMaxYMid meet">
			{flag &&
				<g className="badge">
					<use href="#flag-icon"/>
					<text y="1.6" stroke="none" fill="white" textAnchor="middle">
						{badges.flag}
					</text>
				</g>
			}
			{char &&
				<g className="badge" transform={`translate(${flag ? -7 : 4},0)`}>
					{[...Array(Math.abs(value!)).fill(value)].map((n, i) =>
						<use key={i} href={`#regard_${Math.sign(n)}`}
							fill={`url(#${badges.char}_grad)`}
							transform={`translate(${-(Math.abs(n) - i) * 5 + 1.5},0) scale(0.75)`}
						/>
					)}
					<image href={`./chars/${badges.char}.webp`}
						className="badge"
						x={-(Math.abs(value!) * 5 + 8)}
						y={-3.5} height={7} />
				</g>
			}
		</svg>
		{select &&
			<div className="choices-container">
				{select.map(({text, condition}, i) =>
					<div key={i} className="choice">
						<Bbcode text={text} />

						{condition && <div className="condition">
							<SceneCondition condition={condition}/>
						</div>}
					</div>
				)}
			</div>
		}
	</>
}
const ScenePopover = ({ node }: PopoverProps) => {	
	return (
		<div className="scene-popover-content">
			<SceneIllustration node={node} />
			{settings.flowchartBadges &&
				<SceneBadges node={node} />
			}
		</div>
	)
}

export default ScenePopover


const TokenDisplay = ({ token }: { token: string }) => {
	switch (token) {
		case '&&' : return <span className="separator">&amp;</span>
		case '||' : return <span className="separator">|</span>
		case '>=' : return <span>&ge;</span>
		case '<=' : return <span>&le;</span>
		case '==' : return <span>=</span>
		case '!=' : return <span>&ne;</span>
		default : return <span>{token}</span>
	}
}