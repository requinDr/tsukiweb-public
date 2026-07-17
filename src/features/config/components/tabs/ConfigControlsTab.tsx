import { useRef } from "react"
import { PageSection } from "@tsukiweb/common/ui-core"
import { EventFilter } from "@tsukiweb/common/input/eventActions"
import { bb } from "@tsukiweb/common/utils/Bbcode"
import { inGameControls } from "features/game/utils/keybind"
import { useStrings } from "translation/lang";

type KeyMapEntry = [string, typeof inGameControls[keyof typeof inGameControls]]

function convertAction([action, keys]: KeyMapEntry) : [string, EventFilter[]] {
	return [
		action,
		Array.isArray(keys) ?
			keys.filter(x=>x.constructor != Function && Object.hasOwn(x, 'key')) as EventFilter[]
		: [keys]
	]
}

const ConfigControlsTab = () => {
	const strings = useStrings()
	const controlStrings = strings.config.controls as Record<string, string>
	const keymap = useRef<[string, EventFilter[]][]>(
			Object.entries(inGameControls)
						.filter(([action, _])=> Object.hasOwn(controlStrings, action))
						.map(convertAction))
	return (
		<PageSection>
			{keymap.current.map(([action, keys], i)=> 
				<div key={i} className="key-map">
					<div className="config-name">
						{bb(controlStrings[action])}
					</div>

					<div className="config-actions">
						{keys.map(({code, key, ctrlKey, altKey, shiftKey, repeat})=>
							<kbd key={`${code || key}`} className="key-item">
								{ctrlKey ? "Ctrl + " : ""}
								{altKey ? "Alt + " : ""}
								{shiftKey ? "Shift + " : ""}
								{code || key}
								{repeat != undefined && (
									repeat && <>
										&nbsp;
										<span className="info">
											{bb(controlStrings["_hold"])}
										</span>
									</>
								)}
							</kbd>
						)}
					</div>
				</div>
			)}
		</PageSection>
	)
}

export default ConfigControlsTab