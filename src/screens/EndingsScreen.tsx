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
					{Object.values(endings).map((ending, index) => {
						if (ending.seen || settings.unlockEverything) {
							return <MainEnding ending={ending} key={index} />
						} else {
							return <div key={index} className="ending" />
						}
					})}
					</PageSection>

					<PageSection className="badendings-list">
						<h3>{strings.endings.osiete}</h3>
						<Tooltip id="osiete" place="top" className="tooltip" />
						{Object.values(osiete).map((ending, index)=>
							<Oshiete
								key={index}
								unlocked={settings.unlockEverything || Boolean(ending?.seen)}
								ending={ending}
							/>
						)}
					</PageSection>
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