import styles from "@tsukiweb-common/ui-core/styles/layouts.module.scss"
import '@styles/endings.scss'
import { strings } from '../translation/lang'
import { SCREEN } from '../utils/display'
import { endings, osiete } from '../utils/endings'
import { Tooltip } from 'react-tooltip'
import { settings } from 'utils/settings'
import MainEnding from 'components/endings/MainEnding'
import Oshiete from 'components/endings/Oshiete'
import { viewedScene } from "utils/settings"
import { noBb } from '@tsukiweb-common/utils/Bbcode'
import classNames from 'classnames'
import { useScreenAutoNavigate, useLanguageRefresh } from "hooks"


const EndingsScreen = () => {
	useScreenAutoNavigate(SCREEN.ENDINGS)
	useLanguageRefresh()

	const sawAllEndings = settings.unlockEverything || Object.values(endings).every(e => e.seen)
	const sawEclipse = settings.unlockEverything || viewedScene("eclipse")

	const eclipseUnlocked = sawAllEndings && !sawEclipse

	return (
		<div className={styles.pageContent} id="endings">
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
						unlocked={settings.unlockEverything || viewedScene("eclipse") || eclipseUnlocked}
						ending={{
							id: "eclipse",
							char: "",
							image: eclipseUnlocked ? "" : "ao_02",
							name: strings.extra.eclipse,
							type: "",
							scene: "eclipse"
						}}
						continueScript={eclipseUnlocked} //needed to add to the completed scenes
						divProps={{
							className: classNames({attention: eclipseUnlocked})
						}}
					/>
				</section>

				<section className="badendings">
					<h3>{strings.endings.osiete}</h3>
					<div className='badendings-list'>
						{Object.values(osiete).map((ending, index) =>
							<Oshiete
								key={index}
								unlocked={settings.unlockEverything || Boolean(ending?.seen)}
								ending={ending}
								number={index + 1}
							/>
						)}
					</div>
				</section>
				<Tooltip id="osiete" place="bottom" className="tooltip" />
			</main>
		</div>
	)
}

export default EndingsScreen