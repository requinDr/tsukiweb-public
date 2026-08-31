import { PageSection } from "@tsukiweb/common/ui-core"
import { bb } from "@tsukiweb/common/utils/Bbcode"
import { inGameControls, inGameGestures } from "features/game/utils/keybind"
import { MdSwipeDown, MdSwipeLeft, MdSwipeRight, MdSwipeUp } from "react-icons/md";
import { useStrings } from "translation/lang";

const directionArrows = {up: <MdSwipeUp />, right: <MdSwipeLeft />, down: <MdSwipeDown />, left: <MdSwipeRight />}

const ConfigControlsTab = () => {
	const strings = useStrings()
	const controlStrings = strings.config.controls as Record<string, string>
	const actions = [...new Set([
		...Object.keys(inGameControls),
		...inGameGestures.map(gesture => gesture.action),
	])].filter(action => Object.hasOwn(controlStrings, action))
	return (
		<PageSection>
			{actions.map(action => {
				const keys = (inGameControls[action] ?? [])
					.filter(({key, code}) => key || code)
				const gestures = inGameGestures.filter(gesture => gesture.action === action)
				return <div key={action} className="key-map">
					<div className="config-name">
						{bb(controlStrings[action])}
					</div>

					<div className="config-actions">
						{keys.map(({code, key, ctrlKey, altKey, shiftKey, repeat})=>
							<kbd key={`${code || key}`} className="key">
								{ctrlKey ? "Ctrl + " : ""}
								{altKey ? "Alt + " : ""}
								{shiftKey ? "Shift + " : ""}
								{code || key}
								{repeat != undefined && (
									repeat && <>
										<span className="info">
											{controlStrings["_hold"]}
										</span>
									</>
								)}
							</kbd>
						)}
						{gestures.map(gesture => {
							const layers = gesture.layers
								.map(layer => controlStrings[`_layer-${layer}`])
								.join(' / ')
							return <kbd key={`${gesture.direction}-${layers}`} className="key">
								{directionArrows[gesture.direction]}
								<span className="info">({layers})</span>
							</kbd>
						})}
					</div>
				</div>
			})}
		</PageSection>
	)
}

export default ConfigControlsTab