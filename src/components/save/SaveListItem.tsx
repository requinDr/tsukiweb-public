import classNames from "classnames"
import { getLocale } from "../../translation/lang"
import { QUICK_SAVE_ID, SaveState } from "../../utils/savestates"
import GraphicsGroup from "@tsukiweb-common/graphics/GraphicsGroup"
import SaveSummary from "./SaveSummary"
import { jsonMerge } from "@tsukiweb-common/utils/utils"
import { isPDScene } from "script/utils"
import { ComponentProps } from "react"
import { bb } from "@tsukiweb-common/utils/Bbcode"

type SaveListItemProps = ComponentProps<"button"> & {
	saveId: number
	saveState: SaveState
	isFocused?: boolean
}
const SaveListItem = ({saveId, saveState, isFocused, ...props}: SaveListItemProps)=> {
	const date = new Date(saveState.date as number)
	const isQuickSave = saveId === QUICK_SAVE_ID
	const lastPage = saveState.pages.at(-1)!
	const graphics = jsonMerge(saveState.graphics ?? {},
			lastPage.graphics ?? {bg: "#000"})

	const isPd = lastPage.label && isPDScene(lastPage.label)

	return (
		<button
			className={classNames("save-container", {active: isFocused})}
			onContextMenu={e => e.preventDefault()}
			quick-save={isQuickSave ? "" : undefined}
			{...props}
		>
			<div className="graphics-area">
				<GraphicsGroup
					images={graphics}
					resolution="thumb"
					lazy={true}
				/>
				{lastPage?.type === "choice" &&
					<ChoicesPreview choices={(lastPage as any).choices} />
				}
			</div>
			<div className="deta">
				<time dateTime={date.toISOString()} className="date">
					{date.toLocaleDateString(getLocale())} {date.toLocaleString(getLocale(), {hour: 'numeric', minute: '2-digit'})}
				</time>
				<div className="line">
					<SaveSummary saveState={saveState}/>
				</div>
			</div>
			{isPd &&
				<span className="game-pd">
					<div className="label">
						plus-disc
					</div>
				</span>
			}
		</button>
	)
}

export default SaveListItem


const ChoicesPreview = ({choices}: {choices: Array<{str: string}>})=> (
	<div className="choices-preview">
		{choices.map(({str}, i) =>
			<div key={i} className="choice">
				{bb(str)}
			</div>
		)}
	</div>
)