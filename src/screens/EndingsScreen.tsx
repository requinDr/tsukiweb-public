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
		<div
			className="page" id="endings">
				{/* <h2 className="page-title">{strings.extra.endings}</h2> */}
				
				<main>
					<section className="endings-list">
  					{Object.values(endings).map((ending, index) =>
  						<MainEnding
  							key={index}
  							unlocked={settings.unlockEverything || Boolean(ending?.seen)}
  							ending={{
  								id: ending.char,
  								char: strings.characters[ending.char],
  								image: ending.image,
  								name: noBb(strings.scenario.routes[ending.char][ending.day]),
  								type: ending.type,
  								scene: ending.scene
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
  							type: "",
  							scene: "eclipse"
  						}}
  					/>
					</section>

					<section className="badendings-list">
						<h3>{strings.endings.osiete}</h3>
						{Object.values(osiete).map((ending, index)=>
							<Oshiete
								key={index}
								unlocked={settings.unlockEverything || Boolean(ending?.seen)}
								ending={ending}
							/>
						)}
					</section>
					<Tooltip id="osiete" place="bottom" className="tooltip" />
				</main>
		</div>
	)
}

export default EndingsScreen