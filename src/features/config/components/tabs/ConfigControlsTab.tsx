import { Fragment, ReactComponentElement, ReactElement } from "react"
import { PageSection } from "@tsukiweb/common/ui-core"
import { bb } from "@tsukiweb/common/utils/Bbcode"
import { Gamepad, inGameControls, inGameGestures, menuKeyMap } from "features/game/utils/keybind"
import { MdBackspace, MdKeyboardReturn, MdSpaceBar, MdSportsEsports, MdSwipeDown, MdSwipeLeft, MdSwipeRight, MdSwipeUp, MdTouchApp } from "react-icons/md";
import { PiMouseLeftClickFill, PiMouseRightClickFill } from "react-icons/pi";
import { ScrollUp } from "@tsukiweb/common/icons/scroll_up"
import { useStrings } from "translation/lang";
import { EventActions } from "@tsukiweb/common/input/eventActions";
import { GamepadEvents } from "@tsukiweb/common/input/gamepad";


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
						<MouseControls
							action={action}
						/>
						<KeyboardControls
							action={action}
							controlStrings={controlStrings}
						/>

						<GamepadControls action={action} />

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

const keyLabels: Record<string, string|ReactElement> = {
	ArrowUp: '↑',
	ArrowDown: '↓',
	PageUp: '⇞',
	PageDown: '⇟',
	Control: 'Ctrl',
	Meta: '⌘',
	Space: <MdSpaceBar aria-label="Space" style={{ marginInline: '0.3em' }} />,
	Delete: 'Del',
	Enter: <MdKeyboardReturn aria-label="Enter" />,
	Escape: 'Esc',
	Backspace: <MdBackspace aria-label="Backspace" />,
}
const KeyboardControls = ({ action, controlStrings }: ControlProps) => {
	const keys = (inGameControls[action] ?? [])
		.filter(({ key, code }) => key || code)
	if (action == 'menu')
		keys.push(...menuKeyMap['nav'].filter(({ type, [EventActions.ARGS]: args })=>
			type == 'keydown' && args[0] == "out"))

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
						className="shortcut keyboard"
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


const gamepadLabels: Record<number, string> = {
	[Gamepad.DPadUp]: '↑',
	[Gamepad.DPadRight]: '→',
	[Gamepad.DPadDown]: '↓',
	[Gamepad.DPadLeft]: '←',
}
const GamepadControls = ({ action }: Pick<ControlProps, 'action'>) => {
	const sourceAction = action === 'menu' ? 'back' : action
	const buttons = (inGameControls[sourceAction] ?? [])
		.flatMap(({ buttonId }) => buttonId == undefined ? [] : buttonId)
	if (sourceAction == 'back')
		buttons.push(...menuKeyMap['nav'].flatMap(
			({ type, buttonId, [EventActions.ARGS]: args })=>
				type == GamepadEvents.BTN_PRESSED && args[0] == "out" ? buttonId : []))

	return (
		<>
			{buttons.map(buttonId =>
				<span key={buttonId} className="shortcut gamepad">
					<kbd className="key">
						<MdSportsEsports aria-label="Gamepad" />
						{gamepadLabels[buttonId] ?? Gamepad[buttonId]}
					</kbd>
				</span>
			)}
		</>
	)
}

const mouseControls = {
	next: <PiMouseLeftClickFill aria-label="Left click" />,
	history: <ScrollUp aria-label="Scroll up" />,
	back: <PiMouseRightClickFill aria-label="Right click" />,
	menu: <PiMouseRightClickFill aria-label="Right click" />,
} as const

const MouseControls = ({ action }: Pick<ControlProps, "action">) => {
	if (!(action in mouseControls)) return null

	return (
		<span className="shortcut mouse">
			<kbd className="key">
				{mouseControls[action as keyof typeof mouseControls]}
			</kbd>
		</span>
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
			{action == "next" && <span className="shortcut gesture">
				<kbd className="key">
					<MdTouchApp aria-label="Tap"/>	
				</kbd>	
			</span>}
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