import { ComponentProps, JSX, ReactNode } from 'react'
import '@styles/config.scss'
import ConfigGameTab from './ConfigGameTab'
import ConfigAudioTab from './ConfigAudioTab'
import ConfigAdvancedTab from './ConfigAdvancedTab'
import ConfigControlsTab from './ConfigControlsTab'
import { strings } from '../../translation/lang'
import { useLanguageRefresh } from '../../hooks/useLanguageRefresh'
import { MdQuestionMark } from 'react-icons/md'
import { Button, TitleMenuButton, PageTabsLayout } from '@tsukiweb-common/ui-core'
import { audio } from 'utils/audio'

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
		{label: strings.config['tab-game'], value: ConfigTabs.game},
		{label: strings.config['tab-audio'], value: ConfigTabs.audio},
		{label: strings.config['tab-controls'], value: ConfigTabs.controls},
		{label: strings.config['tab-advanced'], value: ConfigTabs.advanced}
	]

	return (
		<PageTabsLayout
			id="config-layout"
			title={strings.menu.config}
			tabs={tabs}
			selectedTab={selectedTab}
			setSelectedTab={setSelectedTab}
			backButton={
				<TitleMenuButton audio={audio} onClick={back.bind(null)} className="back-button">
					{`<<`} {strings.back}
				</TitleMenuButton>
			}>
			{tabComponents[selectedTab]}
		</PageTabsLayout>
	)
}

export default ConfigLayout


interface ConfigLayoutProps {
	title: ReactNode
	children: ReactNode
	helpAction?: VoidFunction
	[key:string]:any
}
export const ConfigItem = ({ title,  children, helpAction, ...props }: ConfigLayoutProps) => (
	<div className="config" {...props}>
		<div className="config-name">
			<span>{title}</span>

			{helpAction && (
				<button className="icon-help" onClick={helpAction}>
					<MdQuestionMark />
				</button>
			)}
		 </div>

		<div className="config-actions">
			{children}
		</div>
	</div>
)

type ConfigButtonsEntry =
	{ text: string|JSX.Element } & (
	{ value: any, onSelect?: never } |
	{ value?: never, onSelect: VoidFunction })

interface ConfigButtonsProps {
	title: ReactNode
	desc?: ReactNode
	btns: ConfigButtonsEntry[]
	property: string
	conf: Record<string, any>
	disabled?: boolean
	updateValue: (key: any, value: any) => void
	helpAction?: VoidFunction
}
/** Display multiples options to choose from */
export const ConfigButtons = ({title, desc, btns, property, conf, disabled, updateValue, helpAction}: ConfigButtonsProps) => (
	<ConfigItem title={title} desc={desc} helpAction={helpAction}>
		<div className="config-btns">
			{btns.map(({text, value, onSelect}) =>
				<Button
					key={text.toString()}
					onClick={onSelect ?? (() => updateValue(property, value))}
					className="config-btn"
					active={conf[property] === value}
					variant="corner"
					disabled={disabled}
				>
					{text}
				</Button>
			)}
		</div>
	</ConfigItem>
)

export const ResetBtn = ({onClick}: {onClick: ()=> void}) => (
	<div className="reset">
		<Button onClick={onClick}>
			{strings.config.reset}
		</Button>
	</div>
)
