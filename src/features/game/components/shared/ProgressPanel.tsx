import { PartialJSON } from "@tsukiweb-common/types"
import { BADGES_DEFINES } from "features/flowchart/components/badges"
import { Regard, ScriptPlayer } from "engine/ScriptPlayer"
import { strings } from "translation/lang"
import { CHARS } from "app/utils/constants";
import { CharId } from "app/utils/types";


const EndingList = ({ CHARS, script }: { CHARS: string[], script: ScriptPlayer }) => {
	const cleared_routes = CHARS.filter(c=>script.readVariable(`%clear_${c}`))
	const len = cleared_routes.length
	return (
		<svg className="ending-list" viewBox={`-3.5 -3.5 ${7+3.5*(len-1)} 6.5`} >
			{cleared_routes.map((c, i)=>
				<use href="#route_icon"
					key={`${c}-star-index`}
					className="star-icon badge"
					fill={`url(#${c}_grad)`}
					stroke="rgba(255, 255, 255, 0.9)"
					transform={`translate(${i*3.5},0)`}
				/>
			)}
		</svg>
	)
}

const RegardRow = ({ char, value, max }: {char: CharId, value: number, max: number}) => {
	const iconParams = {
		className:"heart-icon",
		fill: `url(#${char}_grad)`
	}
	const n = (max == 0) ? value : Math.min(value, max)
	return (
		<div className="row">
			<img className="char" src={`./res/chars/${char}.webp`}
				alt={strings.characters[char]} />
			<div className="hearts-list">
				<svg viewBox="-3.3 -3.3 13.5 6.3">
					<use href="#regard_heart" {...iconParams} className="badge"/>
					<text x="3" y="2" fontSize={4} fill="#fff">
						&times;{n}
					</text>
				</svg>
			</div>
		</div>
	)
}

const FlagsList = ({ flags }: { flags: string[] }) => {
	return (
		<div className="flags-list">
			{flags.map(flag =>
				<svg key={flag} className="badge" viewBox="-3.5 -3.5 7 7">
					<use href="#flag-icon"/>
					<text y="1.6" stroke="none" fill="white" textAnchor="middle">
						{flag}
					</text>
				</svg>
			)}
		</div>
	)
}

type Props = {
	script: ScriptPlayer,
	flags?: never
	regard?: never
} | {
	script?: never,
	flags: Set<string>|Array<string>,
	regard: PartialJSON<Regard>
}
export const ProgressPanel = ({script, flags, regard}: Props) => {

	if (script) {
		flags = script.flags
		regard = script.regard
	}

	return (
		<div className="progress-panel">
			<svg width="20" height="20" className="defs">{BADGES_DEFINES}</svg>

			{script && <EndingList CHARS={CHARS} script={script}/>}
			{CHARS.filter((c: CharId)=>regard![c] ?? 0 > 0).map((c: CharId)=>
				<RegardRow key={c} char={c} value={regard![c]!} max={20}/>
			)}
			<FlagsList flags={Array.from(flags!)}/>
		</div>
	)
}