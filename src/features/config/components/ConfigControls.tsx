import { Button } from "@tsukiweb/common/ui-core"
import { useButtonSounds } from "@tsukiweb/common/hooks"
import { ComponentProps, JSX, ReactNode } from "react"
import { HiMinus, HiPlus } from "react-icons/hi"
import { MdQuestionMark } from "react-icons/md"
import { audio } from "engine/audio"
import { useStrings } from "translation/lang"

type ConfigItemProps = ComponentProps<"div"> & {
	label: ReactNode
	children: ReactNode
	helpAction?: VoidFunction
}

export const ConfigItem = ({ label, children, helpAction, ...props }: ConfigItemProps) => (
	<div className="config" {...props}>
		<div className="config-name">
			<span>{label}</span>
			{helpAction && (
				<button className="icon-help" onClick={helpAction} nav-auto={1}>
					<MdQuestionMark />
				</button>
			)}
		</div>
		<div className="config-actions">{children}</div>
	</div>
)

const ACTION_PROPS = {
	audio,
	clickSound: "impact",
}

type ConfigButtonsEntry<V> = {
	label: string | JSX.Element
	value: V
	disabled?: boolean
}

interface ConfigButtonsProps<V> {
	currentValue?: V
	onChange: (newValue: V) => void
	btns: ConfigButtonsEntry<V>[]
	disabled?: boolean
}

export const ConfigButtons = <V,>({ currentValue, onChange, btns, disabled }: ConfigButtonsProps<V>) => (
	<div className="config-btns">
		{btns.map(button => (
			<Button
				key={button.label.toString()}
				{...ACTION_PROPS}
				variant="select"
				onClick={() => onChange(button.value)}
				className="config-btn"
				active={currentValue === button.value}
				aria-selected={currentValue === button.value}
				disabled={disabled || button.disabled}
				nav-auto={1}
			>
				{button.label}
			</Button>
		))}
	</div>
)

export const ConfigIconButton = ({ icon, onClick, disabled }: {
	icon: JSX.Element
	onClick: VoidFunction
	disabled?: boolean
}) => {
	const buttonSounds = useButtonSounds(audio, { onClick }, { clickSound: "impact" })
	return <button className="icon btn" {...buttonSounds} disabled={disabled} nav-auto={1}>{icon}</button>
}

type ConfigRangeProps = Omit<ComponentProps<"input">, "type"> & {
	onDecrement: VoidFunction
	onIncrement: VoidFunction
	children?: ReactNode
}

export const ConfigRange = ({ onDecrement, onIncrement, children, disabled, ...props }: ConfigRangeProps) => (
	<div className="config-range">
		<ConfigIconButton icon={<HiMinus />} onClick={onDecrement} disabled={disabled} />
		<input type="range" disabled={disabled} {...props} />
		<ConfigIconButton icon={<HiPlus />} onClick={onIncrement} disabled={disabled} />
		{children}
	</div>
)

export const ResetButton = ({ onClick }: { onClick: VoidFunction }) => {
	const strings = useStrings()
	return (
		<div className="config-reset">
			<Button {...ACTION_PROPS} onClick={onClick} nav-auto={1}>
				{strings.config.reset}
			</Button>
		</div>
	)
}
