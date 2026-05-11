import styles from "@tsukiweb-common/ui-core/styles/layouts.module.scss"
import '@features/endings/styles/endings.scss'
import { Tooltip } from 'react-tooltip'
import { settings } from 'engine/settings'
import MainEnding from 'features/endings/components/MainEnding'
import Oshiete from 'features/endings/components/Oshiete'
import { noBb } from '@tsukiweb-common/utils/Bbcode'
import { useEclipseUnlocked } from "features/endings/hooks/useEclipseUnlocked";
import { endings, osiete } from "features/endings/utils/endings";
import { strings } from "translation/lang";
import { SCREEN } from "app/utils/display";
import { useLanguageRefresh, useScreenAutoNavigate } from "app/hooks";


const EndingsScreen = () => {
	useScreenAutoNavigate(SCREEN.ENDINGS)
	useLanguageRefresh()
	const { sawEclipse, eclipseUnlocked } = useEclipseUnlocked()

	return (
		<main className={styles.pageContent} id="endings">
			<section className="endings-list">
				{Object.values(endings).map((ending, index) =>
					<MainEnding
						key={index}
						unlocked={settings.unlockEverything || Boolean(ending?.seen)}
						ending={{
							id: ending.char,
							char: strings.characters[ending.char],
							image: `event/${ending.image}`,
							name: noBb(strings.scenario.routes[ending.char][ending.day]),
							type: ending.type,
							scene: ending.scene
						}}
						nav-auto={1}
					/>
				)}

				<MainEnding
					unlocked={sawEclipse || eclipseUnlocked}
					ending={{
						id: "eclipse",
						char: "",
						image: eclipseUnlocked ? "" : "event/ao_02",
						name: strings.extra.eclipse,
						type: "",
						scene: "eclipse"
					}}
					continueScript={eclipseUnlocked} //needed to add to the completed scenes
					attention={eclipseUnlocked}
					nav-auto={1}
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
							nav-auto={1}
						/>
					)}
				</div>
			</section>
			<Tooltip id="osiete" place="bottom" className="tooltip" />
		</main>
	)
}

export default EndingsScreen