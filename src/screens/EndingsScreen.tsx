import '../styles/endings.scss'
import styles from "@tsukiweb-common/ui-core/styles/layouts.module.scss"
import { strings } from '../translation/lang'
import { SCREEN } from '../utils/display'
import { endings, osiete } from '../utils/endings'
import { Tooltip } from 'react-tooltip'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import { settings } from 'utils/settings'
import MainEnding from 'components/endings/MainEnding'
import Oshiete from 'components/endings/Oshiete'
import { viewedScene } from 'utils/savestates'
import { noBb } from '@tsukiweb-common/utils/Bbcode'
import { useMemo } from 'react'
import classNames from 'classnames'


const EndingsScreen = () => {
	useScreenAutoNavigate(SCREEN.ENDINGS)
	useLanguageRefresh()

	const [allEndingsSeen, eclipseSeen] = useMemo(()=> {
		const allEndingsSeen = settings.unlockEverything || Object.values(endings).every(e=>e.seen)
		const eclipseSeen = settings.unlockEverything || viewedScene("eclipse")
		return [allEndingsSeen, eclipseSeen]
	}, [settings.completedScenes, settings.unlockEverything])

	const eclipseUnlocked = allEndingsSeen && !eclipseSeen

	return (
		<div className={`${styles.pageContent}`} id="endings">
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
						{Object.values(osiete).map((ending, index)=>
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