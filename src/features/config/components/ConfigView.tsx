import { DivProps } from "@tsukiweb/common/types"
import { PageLayout, TabsBar } from "@tsukiweb/common/ui-core"
import PageBackButton from "app/components/PageBackButton"
import { audio } from "engine/audio"
import { useStrings } from "translation/lang"
import "../styles/config.scss"
import ConfigAdvancedTab from "./tabs/ConfigAdvancedTab"
import ConfigAudioTab from "./tabs/ConfigAudioTab"
import ConfigControlsTab from "./tabs/ConfigControlsTab"
import ConfigGameTab from "./tabs/ConfigGameTab"

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
	onBack: VoidFunction
	selectedTab: ConfigTabs
	setSelectedTab: (activeTab: ConfigTabs) => void
} & DivProps

const ConfigView = ({ onBack, selectedTab, setSelectedTab, ...props }: Props) => {
	const strings = useStrings()
	const tabs = [
		{ label: strings.config["tab-game"], value: ConfigTabs.game, audio },
		{ label: strings.config["tab-audio"], value: ConfigTabs.audio, audio },
		{ label: strings.config["tab-controls"], value: ConfigTabs.controls, audio },
		{ label: strings.config["tab-advanced"], value: ConfigTabs.advanced, audio },
	]

	return (
		<PageLayout
			{...props}
			id="config-layout"
			variant="tabs"
			title={strings.menu.config}
			navigation={
				<TabsBar tabs={tabs} selected={selectedTab} setSelected={selected => setSelectedTab(selected)} />
			}
			actions={<PageBackButton onClick={onBack} />}
			onBack={onBack}
		>
			{tabComponents[selectedTab]}
		</PageLayout>
	)
}

export default ConfigView