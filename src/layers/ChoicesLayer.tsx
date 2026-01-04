import { memo, RefObject, useEffect, useRef, useState } from "react"
import { Choice, LabelName } from "../types"
import history from "../script/history"
import { Bbcode } from "@tsukiweb-common/utils/Bbcode"
import { ScriptPlayer } from "script/ScriptPlayer"
import { preprocessText } from "@tsukiweb-common/utils/utils"
import { strings } from "../translation/lang"
import { Button } from "@tsukiweb-common/ui-core"
import { audio } from "utils/audio"
import * as m from "motion/react-m"
import { Variants } from "motion/react"

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
	arg = arg.replaceAll(/`[^`]`,/g, '') // remove choice index (temporary fix before logic.txt is updated on server)
	const labels = arg.split(',') as LabelName[]
	const choices: Choice[] = labels.map((label, index) => {
		return {
			index,
			str: strings.choices[currentLabel]![index],
			label
		}
	})

	if (choices.length == 0)
		console.error(`canot parse choices ${arg}`)
	
	setChoices(choices)
	history.onChoicePrompt(choices)

	onSelection.current = (choice)=> {
		//console.debug(choice)
		script.setNextLabel(choice.label)
		script.skipCurrentBlock()
		onSelection.current = undefined
		setChoices([])
		onFinish()
		history.onChoiceSelected(choice.index)
	}
	return {
		next: ()=>{}, // prevent continuing to next instruction
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