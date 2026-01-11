import { memo, RefObject, useEffect, useRef, useState } from "react"
import { Choice, LabelName } from "../types"
import history from "../script/history"
import { Bbcode } from "@tsukiweb-common/utils/Bbcode"
import { ScriptPlayer } from "script/ScriptPlayer"
import { strings } from "../translation/lang"
import { Button } from "@tsukiweb-common/ui-core"
import { audio } from "utils/audio"
import * as m from "motion/react-m"
import { Variants } from "motion/react"
import { checkIfCondition } from "@tsukiweb-common/script/utils"

const container: Variants = {
	hidden: {},
	show: {
		transition: {
			staggerChildren: 0.1,
		},
	},
}

const item: Variants = {
	hidden: { opacity: 0, translateY: 10 },
	show: {
		opacity: 1,
		translateY: 0,
		transition: {
			duration: 0.2,
			ease: "easeOut"
		}
	},
}

type SelectionCallback = (choice: Choice)=>void

//##############################################################################
//#region                       COMMAND HANDLERS
//##############################################################################


function processSelect(setChoices: (choices: Choice[])=>void,
											 onSelection: RefObject<SelectionCallback|undefined>,
											 arg: string, _cmd: string, script: ScriptPlayer,
											 onFinish: VoidFunction) {
	const currentLabel = script.currentLabel.replace('skip', 'f') as LabelName
	const labels = arg.split(',')
	const choices: Choice[] = labels.map((item, index) => {
		const m = item.match(/^(\([^\)]*\))?(\[[^\]]*\])?(\*\w+)$/)
		if (!m)
			throw Error(`Unable to parse choice entry "${item}"`)
		const hideCondition = m[1]?.substring(1, m[1]!.length-1) // remove ()
		const disableCondition = m[2]?.substring(1, m[2]!.length-1) // remove []
		const label = m[3] as LabelName
		if (!label)
			throw Error(`missing label in ${item}`)
		if (hideCondition && !checkIfCondition(hideCondition, script))
			return null
		const disable = disableCondition ?
			!checkIfCondition(disableCondition, script)
			: false
		return {
			index,
			str: strings.choices[currentLabel]![index],
			label,
			disable
		}
	}).filter(x => x != null)

	if (choices.length == 0)
		console.error(`canot parse choices ${arg}`)

	onSelection.current = (choice)=> {
		//console.debug(choice)
		script.setNextLabel(choice.label)
		script.skipCurrentBlock()
		onSelection.current = undefined
		setChoices([])
		onFinish()
		history.onChoiceSelected(choice.index)
	}

	if (choices.length == 1)
		onSelection.current(choices[0])
	else {
		setChoices(choices)
		history.onChoicePrompt(choices)
		return {
			next: ()=>{}, // prevent continuing to next instruction
		}
	}
}

//#endregion ###################################################################
//#region                           COMPONENT
//##############################################################################

type Props = {
	script: ScriptPlayer
	display: boolean
	navigable: boolean
}

const ChoicesLayer = ({script, display, navigable}: Props) => {
	const [choices, setChoices] = useState<Choice[]>([])
	const onSelection = useRef<SelectionCallback|undefined>(undefined)

	useEffect(()=> {
		script.setCommand('select',
			processSelect.bind(null, setChoices, onSelection))
	}, [script])

	if (!display || choices.length == 0) return null

	return (
		<div className="layer" id="layer-choices">
			<m.div className="choices-container" variants={container} initial="hidden" animate="show">
				{choices.map((choice, i) =>
					<m.div key={choice.index} variants={item} style={{width: '100%', display: 'grid'}}>
						<Button
							disabled={choice.disable ?? false}
							key={choice.index}
							variant={null}
							className="choice"
							onClick={() => onSelection.current?.(choice)}
							audio={audio}
							hoverSound="tick"
							clickSound="impact"
							//i-0.5 to place cursor on second choice when pressing down
							{...(navigable && {'nav-y': i-0.5})}
						>
							<Bbcode text={choice.str} />
						</Button>
					</m.div>
				)}
			</m.div>
		</div>
	)
}

export default memo(ChoicesLayer)