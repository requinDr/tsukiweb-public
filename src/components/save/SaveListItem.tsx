import classNames from "classnames"
import { getLocale } from "../../translation/lang"
import { QUICK_SAVE_ID, SaveState } from "../../utils/savestates"
import GraphicsGroup from "../molecules/GraphicsGroup"
import SaveSummary from "./SaveSummary"

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
	const lastPage = saveState.pages[saveState.pages.length-1]

	return (
		<button
			className={classNames("save-container", {active: id==focusedSave})}
			onClick={onSelect.bind(null, id)}
			{...(isQuickSave ? {'quick-save':''} : {})}
			{...buttonProps}
		>
			<GraphicsGroup
				images={lastPage?.graphics ?? {bg: ""}}
				resolution="thumb"
				lazy={true}
			/>

			<div className="deta">
				<time dateTime={date.toISOString()} className="date">
					{date.toLocaleDateString(getLocale())} {date.toLocaleString(getLocale(), {hour: 'numeric', minute: '2-digit'})}
				</time>
				{lastPage?.type === "choice" &&
					<span className="chip-choice">
						choice
					</span>
				}

				<div className="line">
					<SaveSummary saveState={saveState}/>
				</div>
			</div>
		</button>
	)
}

export default SaveListItem