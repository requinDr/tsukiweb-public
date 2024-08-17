import '../styles/endings.scss'
import { motion } from 'framer-motion'
import { strings } from '../translation/lang'
import { SCREEN } from '../utils/display'
import { endings, osiete } from '../utils/endings'
import { Tooltip } from 'react-tooltip'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import PageSection from '@tsukiweb-common/ui-core/layouts/PageSection'
import { settings } from 'utils/settings'
import Button from '@tsukiweb-common/ui-core/components/Button'
import MainEnding from 'components/endings/MainEnding'
import Oshiete from 'components/endings/Oshiete'
import { viewedScene } from 'utils/savestates'
import { noBb } from '@tsukiweb-common/utils/Bbcode'


const EndingsScreen = () => {
	useScreenAutoNavigate(SCREEN.ENDINGS)
	useLanguageRefresh()

	return (
		<motion.div
			className="page" id="endings"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<div className="page-content">
				<h2 className="page-title">{strings.extra.endings}</h2>
				
				<main>
					<PageSection className="endings-list">
					{Object.values(endings).map((ending, index) =>
						<MainEnding
							key={index}
							unlocked={settings.unlockEverything || Boolean(ending?.seen)}
							ending={{
								id: ending.char,
								char: strings.characters[ending.char],
								image: ending.image,
								name: noBb(strings.scenario.routes[ending.char][ending.day]),
								type: ending.type
							}}
						/>
					)}

					<MainEnding
						unlocked={settings.unlockEverything || viewedScene("eclipse")}
						ending={{
							id: "eclipse",
							char: "",
							image: "ao_02",
							name: strings.extra.eclipse,
							type: ""
						}}
					/>
					</PageSection>

					<PageSection className="badendings-list">
						<h3>{strings.endings.osiete}</h3>
						{Object.values(osiete).map((ending, index)=>
							<Oshiete
								key={index}
								unlocked={settings.unlockEverything || Boolean(ending?.seen)}
								ending={ending}
							/>
						)}
					</PageSection>
					<Tooltip id="osiete" place="bottom" className="tooltip" />
				</main>

				<Button
					variant="menu"
					to={SCREEN.TITLE}
					className="back-button">
					{strings.back}
				</Button>
			</div>
		</motion.div>
	)
}

export default EndingsScreen