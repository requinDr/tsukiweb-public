import { ComponentProps, JSX, ReactNode } from 'react'
import '@styles/config.scss'
import ConfigGameTab from './ConfigGameTab'
import ConfigAudioTab from './ConfigAudioTab'
import ConfigAdvancedTab from './ConfigAdvancedTab'
import ConfigControlsTab from './ConfigControlsTab'
import { strings } from '../../translation/lang'
import { useLanguageRefresh } from '../../hooks/useLanguageRefresh'
import { MdQuestionMark } from 'react-icons/md'
import { HiMinus, HiPlus } from 'react-icons/hi'
import { Button, TitleMenuButton, PageTabsLayout } from '@tsukiweb-common/ui-core'
import { audio } from 'utils/audio'
import { useButtonSounds } from '@tsukiweb-common/hooks'

export enum ConfigTabs {
	game = "game",
	audio = "audio",
	controls = "controls",
	advanced = "advanced",
}

const tabComponents = {
	[ConfigTabs.game]: <ConfigGameTab />,
	[ConfigTabs.audio]: <ConfigAudioTab />,
	[ConfigTabs.controls]: <ConfigControlsTab />,
	[ConfigTabs.advanced]: <ConfigAdvancedTab />,
}

type Props = {
	back: ()=>void
	selectedTab: ConfigTabs
	setSelectedTab: (activeTab: ConfigTabs)=>void
}

const ConfigLayout = ({back, selectedTab, setSelectedTab}: Props) => {
	useLanguageRefresh()

	const tabs: ComponentProps<typeof PageTabsLayout>["tabs"] = [
		{label: strings.config['tab-game'], value: ConfigTabs.game, audio: audio},
		{label: strings.config['tab-audio'], value: ConfigTabs.audio, audio: audio},
		{label: strings.config['tab-controls'], value: ConfigTabs.controls, audio: audio},
		{label: strings.config['tab-advanced'], value: ConfigTabs.advanced, audio: audio}
	]

	return (
		<PageTabsLayout
			id="config-layout"
			title={strings.menu.config}
			tabs={tabs}
			selectedTab={selectedTab}
			setSelectedTab={setSelectedTab}
			backButton={
				<TitleMenuButton audio={audio} onClick={back.bind(null)} className="back-button" nav-auto={1}>
					{`<<`} {strings.back}
				</TitleMenuButton>
			}>
			{tabComponents[selectedTab]}
		</PageTabsLayout>
	)
}

export default ConfigLayout


type ConfigLayoutProps = ComponentProps<'div'> & {
	label: ReactNode
	children: ReactNode
	helpAction?: VoidFunction
}
export const ConfigItem = ({ label, children, helpAction, ...props }: ConfigLayoutProps) => (
	<div className="config" {...props}>
		<div className="config-name">
			<span>{label}</span>

			{helpAction && (
				<button className="icon-help" onClick={helpAction} nav-auto={1}>
					<MdQuestionMark />
				</button>
			)}
		 </div>

		<div className="config-actions">
			{children}
		</div>
	</div>
)


const ACTION_PROPS = {
	audio: audio,
	clickSound: "impact"
}

type ConfigButtonsEntry<V> = {
	label: string | JSX.Element,
	value: V,
	disabled?: boolean
}

interface ConfigButtonsProps<V> {
	currentValue?: V
	onChange: (newValue: V) => void
	btns: ConfigButtonsEntry<V>[]
	disabled?: boolean
}
/** Display multiples options to choose from */
export const ConfigButtons = <V,>({currentValue, onChange, btns, disabled}: ConfigButtonsProps<V>) => {
	return (
		<div className="config-btns">
			{btns.map(b =>
				<Button
					key={b.label.toString()}
					{...ACTION_PROPS}
					variant="select"
					onClick={() => onChange(b.value)}
					className="config-btn"
					active={currentValue === b.value}
					disabled={disabled || b.disabled}
					nav-auto={1}
				>
					{b.label}
				</Button>
			)}
		</div>
	)
}

export const ConfigIconButton = ({icon, onClick, disabled}: {icon: JSX.Element, onClick: VoidFunction, disabled?: boolean}) => {
	const btnSound = useButtonSounds(audio, {onClick}, {clickSound: "impact"})
	return (
		<button className="icon btn" {...btnSound} disabled={disabled} nav-auto={1}>
			{icon}
		</button>
	)
}

type ConfigRangeProps = Omit<ComponentProps<'input'>, 'type'> & {
	onDecrement: VoidFunction
	onIncrement: VoidFunction
	children?: ReactNode
}
export const ConfigRange = ({ onDecrement, onIncrement, children, disabled, ...props }: ConfigRangeProps) => {
	return (
		<div className="config-range">
			<ConfigIconButton icon={<HiMinus />} onClick={onDecrement} disabled={disabled} />
			<input type="range" disabled={disabled} {...props} />
			<ConfigIconButton icon={<HiPlus />} onClick={onIncrement} disabled={disabled} />
			{children}
		</div>
	)
}

export const ResetButton = ({onClick}: {onClick: ()=> void}) => (
	<div className="config-reset">
		<Button {...ACTION_PROPS} onClick={onClick} nav-auto={1}>
			{strings.config.reset}
		</Button>
	</div>
)
