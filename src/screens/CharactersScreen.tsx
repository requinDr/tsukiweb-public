import '@styles/characters.scss'
import { SCREEN } from '../utils/display'
import { PageTabsLayout } from '@tsukiweb-common/ui-core'
import useQueryParam from '@tsukiweb-common/hooks/useQueryParam'
import * as m from "motion/react-m"
import { AnimatePresence, Variants } from 'motion/react'
import { useLanguageRefresh, useScreenAutoNavigate } from 'hooks'
import { CHARACTERS_DATA, CharactersTabs } from 'utils/characters-data'
import CharacterPanel from 'components/characters/CharacterPanel'
import { ComponentProps } from 'react'

const container: Variants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.5
		}
	}
}

const CharactersScreen = () => {
	useScreenAutoNavigate(SCREEN.CHARACTERS)
	useLanguageRefresh()
	const [selectedTab, setSelectedTab] = useQueryParam<CharactersTabs>("tab", CharactersTabs.ark)

	const tabs: ComponentProps<typeof PageTabsLayout>["tabs"] = Object.values(CharactersTabs).map(tab => ({
		label: CHARACTERS_DATA[tab].name,
		value: tab
	}))

	return (
		<PageTabsLayout
			id="characters"
			tabs={tabs}
			selectedTab={selectedTab}
			setSelectedTab={setSelectedTab}
		>
			<AnimatePresence mode="popLayout">
				<m.div
					key={selectedTab}
					variants={container}
					initial="hidden"
					animate="show"
					exit="hidden"
					style={{ width: "100%" }}
				>
					<CharacterPanel char={selectedTab} />
				</m.div>
			</AnimatePresence>
		</PageTabsLayout>
	)
}

export default CharactersScreen