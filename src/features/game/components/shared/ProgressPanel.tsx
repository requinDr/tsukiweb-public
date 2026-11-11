import { FlagBadge } from "@tsukiweb/common/icons/badges"
import { CharPointBadge, RouteBadge } from "features/flowchart/components/badges"
import { ScriptPlayer } from "engine/ScriptPlayer"
import { useStrings } from "translation/lang"
import { CHARS } from "app/utils/constants";
import { CharId } from "app/utils/types";


const EndingList = ({ CHARS, script }: { CHARS: CharId[], script: ScriptPlayer }) => {
	const cleared_routes = CHARS.filter(c=>script.readVariable(`%clear_${c}`))
	return (
		<div className="ending-list">
			{cleared_routes.map(c=> <RouteBadge key={c} char={c}/>)}
		</div>
	)
}

const RegardRow = ({ char, value, max }: {char: CharId, value: number, max: number}) => {
	const strings = useStrings()
	const n = (max == 0) ? value : Math.min(value, max)
	return (
		<div className="row" title={strings.characters[char]}>
			<CharPointBadge char={char}/>
			<span className="count">&times;{n}</span>
		</div>
	)
}

const FlagsList = ({ flags }: { flags: string[] }) => {
	return (
		<div className="flags-list">
			{flags.map(flag => <FlagBadge key={flag} icon={flag}/>)}
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
	regard: Partial<Record<CharId, number>>
}
export const ProgressPanel = ({script, flags, regard}: Props) => {

	if (script) {
		flags = script.flags
		regard = Object.fromEntries(script.points.entries())
	}

	return (
		<div className="progress-panel">
			{script && <EndingList CHARS={CHARS} script={script}/>}
			{CHARS.filter((c: CharId)=>regard![c] ?? 0 > 0).map((c: CharId)=>
				<RegardRow key={c} char={c} value={regard![c]!} max={20}/>
			)}
			<FlagsList flags={Array.from(flags!)}/>
		</div>
	)
}
