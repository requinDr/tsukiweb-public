import '@features/config/styles/config.scss'
import * as m from "motion/react-m"
import { useDefaultNavBack, useQueryParam } from '@tsukiweb/common/hooks'
import ConfigView, { ConfigTabs } from 'features/config/components/ConfigView';
import { useScreenAutoNavigate } from 'app/hooks';
import { SCREEN, displayMode } from 'app/utils/display';

function handleBack() {
	displayMode.screen = SCREEN.TITLE
}

const ConfigScreen = () => {
	useScreenAutoNavigate(SCREEN.CONFIG)
	useDefaultNavBack(handleBack)
	const [selectedTab, setSelectedTab] = useQueryParam<ConfigTabs>("tab", ConfigTabs.game)

	return (
		<m.main
			className="page" id="config"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<ConfigView
				onBack={handleBack}
				selectedTab={selectedTab}
				setSelectedTab={setSelectedTab}
			/>
		</m.main>
	)
}

export default ConfigScreen