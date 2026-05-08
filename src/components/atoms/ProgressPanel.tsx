import { PartialJSON } from "@tsukiweb-common/types"
import { BADGES_DEFINES } from "components/flowchart/badges"
import { BiSolidHeart, BiSolidStar } from "react-icons/bi"
import { Regard, ScriptPlayer } from "script/ScriptPlayer"
import { strings } from "translation/lang"
import { CharId } from "types"
import { CHARS } from "utils/constants"

type Props = {
	script: ScriptPlayer,
	flags?: never
	regard?: never
} | {
	script?: never,
	flags: Set<string>|Array<string>,
	regard: PartialJSON<Regard>
}
const AffectionRow = ({ char, value, max }: {char: CharId, value: number, max: number}) => {
	return (
		<div className="row">
			<img className="char" src={`./chars/${char}.webp`}
				alt={strings.characters[char]} />
			<div className="hearts-list">
				{Array(max ? Math.min(value, max) : value)
					.fill(null).map((_, index) =>
					<BiSolidHeart
						key={`${char}-heart-${index}`}
						className="heart-icon"
						style={{
							fill: `url(#${char}_grad)`,
							stroke: "rgba(255, 255, 255, 0.9)",
							strokeWidth: 1
						}}
					/>
				)}
			</div>
		</div>
	)
}
const FlagsList = ({ flags }: { flags: string[] }) => {
	return (
		<div className="flags-list">
			{flags.map(flag =>
				<svg key={flag} className="badge" viewBox="-4 -4 8 8" preserveAspectRatio="xMinYMid meet">
					<g className="badge">
						<use href="#flag-icon"/>
						<text y="1.6" stroke="none" fill="white" textAnchor="middle">
							{flag}
						</text>
					</g>
				</svg>
			)}
		</div>
	)
}

const ClearList = ({ CHARS, script }: { CHARS: string[], script: ScriptPlayer }) => {
	return (
		<div className="clear-list">
			{CHARS.filter(c=>script.readVariable(`%clear_${c}`)).map(c=>
				<BiSolidStar
					key={`${c}-heart-index`}
					className="star-icon"
					style={{
						fill: `url(#${c}_grad)`,
						stroke: "rgba(255, 255, 255, 0.9)",
						strokeWidth: 1
					}}
				/>
			)}
		</div>
	)
}

export const ProgressPanel = ({script, flags, regard}: Props) => {

	if (script) {
		flags = script.flags
		regard = script.regard
	}

	return (
		<div className="progress-panel">
			<svg width="20" height="20" className="defs">{BADGES_DEFINES}</svg>

			{script && <ClearList CHARS={CHARS} script={script}/>}
			{CHARS.filter(c=>regard![c] ?? 0 > 0).map(c=>
				<AffectionRow key={c} char={c} value={regard![c]!} max={20}/>
			)}
			<FlagsList flags={Array.from(flags!)}/>
		</div>
	)
}