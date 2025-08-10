import { ComponentProps, JSX, ReactNode, useEffect, useState } from 'react'
import '@styles/config.scss'
import ConfigGameTab from './ConfigGameTab'
import ConfigAudioTab from './ConfigAudioTab'
import ConfigAdvancedTab from './ConfigAdvancedTab'
import ConfigControlsTab from './ConfigControlsTab'
import { strings } from '../../translation/lang'
import { SCREEN } from '../../utils/display'
import { useLanguageRefresh } from '../../hooks/useLanguageRefresh'
import { MdQuestionMark } from 'react-icons/md'
import { Button, TitleMenuButton, PageTabsLayout } from '@tsukiweb-common/ui-core'

enum Tabs {
	game = "game",
	audio = "audio",
	controls = "controls",
	advanced = "advanced",
}

const tabComponents = {
	[Tabs.game]: <ConfigGameTab />,
	[Tabs.audio]: <ConfigAudioTab />,
	[Tabs.controls]: <ConfigControlsTab />,
	[Tabs.advanced]: <ConfigAdvancedTab />,
}

type Props = {
	back: ()=>void,
	selectedTab?: Tabs,
	setSelectedTab?: (activeTab: string)=>void,
	page?: string,
}

const ConfigLayout = ({back, selectedTab, setSelectedTab, page}: Props) => {
	const [activeTab, setActiveTab] = useState(selectedTab || Tabs.game)
	useLanguageRefresh()

	useEffect(()=> {
		if (!Object.hasOwn(tabComponents, activeTab))
			setActiveTab(Tabs.game)
		else if (setSelectedTab)
		setSelectedTab(activeTab)
	}, [activeTab])

	const tabs: ComponentProps<typeof PageTabsLayout>["tabs"] = [
		{label: strings.config['tab-game'], value: Tabs.game},
		{label: strings.config['tab-audio'], value: Tabs.audio},
		{label: strings.config['tab-controls'], value: Tabs.controls},
		{label: strings.config['tab-advanced'], value: Tabs.advanced, disabled: page !== SCREEN.CONFIG}
	]

	return (
		<PageTabsLayout
			id="config-layout"
			title={strings.menu.config}
			tabs={tabs}
			selectedTab={activeTab}
			setSelectedTab={setActiveTab}
			backButton={
				<TitleMenuButton onClick={back.bind(null)} className="back-button">
					{`<<`} {strings.back}
				</TitleMenuButton>
			}>
			{tabComponents[activeTab]}
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
				<button className="icon-help" style={{ marginLeft: 4}} onClick={helpAction}>
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