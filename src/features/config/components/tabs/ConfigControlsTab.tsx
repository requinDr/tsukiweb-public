import { Fragment } from "react"
import { PageSection } from "@tsukiweb/common/ui-core"
import { bb } from "@tsukiweb/common/utils/Bbcode"
import { inGameControls, inGameGestures } from "features/game/utils/keybind"
import { MdSwipeDown, MdSwipeLeft, MdSwipeRight, MdSwipeUp } from "react-icons/md";
import { useStrings } from "translation/lang";


const ConfigControlsTab = () => {
	const strings = useStrings()
	const controlStrings = strings.config.controls as Record<string, string>
	const actions = [...new Set([
		...Object.keys(inGameControls),
		...inGameGestures.map(gesture => gesture.action),
	])].filter(action => Object.hasOwn(controlStrings, action))

	return (
		<PageSection>
			{actions.map(action =>
				<div key={action} className="key-map">
					<div className="config-name">
						{bb(controlStrings[action])}
					</div>

					<div className="config-actions">
						<KeyboardControls
							action={action}
							controlStrings={controlStrings}
						/>

						<GestureControls
							action={action}
							controlStrings={controlStrings}
						/>
					</div>
				</div>
			)}
		</PageSection>
	)
}

export default ConfigControlsTab



type ControlProps = {
	action: string
	controlStrings: Record<string, string>
}

const keyLabels: Record<string, string> = {
	ArrowUp: '↑',
	ArrowDown: '↓',
	PageUp: '⇞',
	PageDown: '⇟',
	Control: 'Ctrl',
	Meta: '⌘',
}
const KeyboardControls = ({ action, controlStrings }: ControlProps) => {
	const keys = (inGameControls[action] ?? [])
		.filter(({ key, code }) => key || code)

	return (
		<>
			{keys.map(({ code, key, ctrlKey, altKey, shiftKey, repeat }) => {
				const value = code || key!

				const parts = [
					ctrlKey && "Ctrl",
					altKey && "Alt",
					shiftKey && "Shift",
					keyLabels[value] ?? value,
				].filter(Boolean) as string[]

				return (
					<span
						key={`${parts.join("+")}-${repeat}`}
						className="shortcut"
					>
						{parts.map((part, partIndex) =>
							<Fragment key={part}>
								{partIndex > 0 && <span>+</span>}

								<kbd className="key">{part}</kbd>

								{partIndex === parts.length - 1 && repeat && (
									<span className="info">
										{controlStrings._hold}
									</span>
								)}
							</Fragment>
						)}
					</span>
				)
			})}
		</>
	)
}


const directionArrows = {
	up: <MdSwipeUp aria-label="Swipe up" />,
	right: <MdSwipeRight aria-label="Swipe right" />,
	down: <MdSwipeDown aria-label="Swipe down" />,
	left: <MdSwipeLeft aria-label="Swipe left" />
}
const GestureControls = ({ action, controlStrings }: ControlProps) => {
	const gestures = inGameGestures.filter(gesture => gesture.action === action)

	return (
		<>
			{gestures.map(gesture => {
				const layers = gesture.layers
					.map(layer => controlStrings[`_layer-${layer}`])
					.join(" / ")

				return (
					<span
						key={`${gesture.direction}-${layers}`}
						className="shortcut gesture"
					>
						<kbd className="key">
							{directionArrows[gesture.direction]}
						</kbd>

						<span className="info">{layers}</span>
					</span>
				)
			})}
		</>
	)
}