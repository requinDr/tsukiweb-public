import classNames from "classnames"
import { getLocale } from "../../translation/lang"
import { QUICK_SAVE_ID, SaveState } from "../../utils/savestates"
import GraphicsGroup from "../molecules/GraphicsGroup"
import SaveSummary from "./SaveSummary"
import { jsonMerge } from "@tsukiweb-common/utils/utils"
import { isPDScene } from "script/utils"

type SaveListItemProps = {
	id: number,
	saveState: SaveState,
	onSelect: (id: number)=>void,
	focusedSave?: number,
	buttonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>,
}
const SaveListItem = ({id, saveState, onSelect, focusedSave, buttonProps}: SaveListItemProps)=> {
	const date = new Date(saveState.date as number)
	const isQuickSave = id === QUICK_SAVE_ID
	const lastPage = saveState.pages.at(-1)!
	const graphics = jsonMerge(saveState.graphics ?? {},
			lastPage.graphics ?? {bg: "#000"})

	const isPd = lastPage.label && isPDScene(lastPage.label)

	return (
		<button
			className={classNames("save-container", {active: id==focusedSave})}
			onClick={onSelect.bind(null, id)}
			{...(isQuickSave ? {'quick-save':''} : {})}
			{...buttonProps}
		>
			<GraphicsGroup
				images={graphics}
				resolution="thumb"
				lazy={true}
			/>

			<div className="deta">
				<time dateTime={date.toISOString()} className="date">
					{date.toLocaleDateString(getLocale())} {date.toLocaleString(getLocale(), {hour: 'numeric', minute: '2-digit'})}
				</time>
				{lastPage?.type === "choice" &&
					<span className="chip chip__choice">
						choice
					</span>
				}

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