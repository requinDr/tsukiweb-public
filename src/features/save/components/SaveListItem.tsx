import classNames from "classnames"
import { GraphicsGroup } from "@tsukiweb/common/graphics"
import SaveSummary from "./SaveSummary"
import { jsonMerge } from "@tsukiweb/common/utils/utils"
import { isPDScene } from "engine/utils"
import { ComponentProps } from "react"
import { ChoicesPreview } from "@tsukiweb/common/choices"
import { QUICK_SAVE_ID, SaveState } from "engine/savestates";
import { getLocale } from "translation/lang";

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
			<div className="details">
				<time dateTime={date.toISOString()} className="date">
					{date.toLocaleDateString(getLocale())} {date.toLocaleString(getLocale(), {hour: 'numeric', minute: '2-digit'})}
				</time>
				<div className="line">
					<SaveSummary saveState={saveState}/>
				</div>
			</div>
			{isPd &&
				<span className="game-pd">
					Plus-Disc
				</span>
			}
		</button>
	)
}

export default SaveListItem
