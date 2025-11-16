import gameLogo from "@assets/images/tsukihime-logo.webp"
import moon from "@assets/images/moon.webp"
import '@styles/title-menu.scss'
import { SCREEN } from '../utils/display'
import * as m from "motion/react-m"
import { continueGame, newGame, savesManager } from '../utils/savestates'
import { strings } from "../translation/lang"
import { MdOutlineVolumeOff, MdOutlineVolumeUp } from 'react-icons/md'
import { settings } from '../utils/settings'
import AppInfo from '../components/title-menu/AppInfo'
import TranslationSwitch from '../components/title-menu/TranslationSwitch'
import { useObserved } from '@tsukiweb-common/utils/Observer'
import { useNavigate } from "react-router"
import history from 'utils/history'
import { TitleMenuButton } from '@tsukiweb-common/ui-core'
import { useScreenAutoNavigate, useLanguageRefresh } from 'hooks'
import useEclipseUnlocked from 'hooks/useEclipseUnlocked'

const TitleMenuScreen = () => {
	const navigate = useNavigate()
	useScreenAutoNavigate(SCREEN.TITLE)
	const [conf] = useObserved(settings.volume, 'master')
	useLanguageRefresh()
	const { eclipseUnlocked } = useEclipseUnlocked()

	return (
		<m.div
			className="page" id="title-menu"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<div className="logo">
				<m.img
					src={moon} alt="moon"
					draggable={false}
					className="moon"
					initial={{ opacity: 0.9, transform: "translateY(-42%) scale(0.9)" }}
					animate={{ opacity: 0.5, transform: "translateY(-50%) scale(1)" }}
					transition={{
						delay: 0,
						duration: 1,
					}} />
				<m.img
					src={gameLogo} alt="Tsukihime logo"
					draggable={false}
					className='tsuki-logo'
					initial={{ opacity: 0, scale: 0.7 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{
						delay: 0.4,
						duration: 0.8,
					}} />
			</div>

			<nav className="menu">
				<div className='menu-buttons'>
					<TitleMenuButton onClick={newGame}>
						{strings.title.start}
					</TitleMenuButton>

					{(savesManager.savesCount > 0 || history.pagesLength > 0) &&
					<TitleMenuButton onClick={continueGame}>
						{strings.title.resume}
					</TitleMenuButton>
					}

					<TitleMenuButton onClick={() => navigate(SCREEN.LOAD)}>
						{strings.title.load}
					</TitleMenuButton>

					<TitleMenuButton onClick={() => navigate(SCREEN.CONFIG)}>
						{strings.title.config}
					</TitleMenuButton>

					<TitleMenuButton onClick={() => navigate(SCREEN.GALLERY)} attention={eclipseUnlocked}>
						{strings.title.extra}
					</TitleMenuButton>
				</div>
			</nav>

			<div className='top-actions'>
				<m.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.8,
						duration: 1,
					}}>
					<button
						className="action-icon"
						onContextMenu={e => e.preventDefault()}
						aria-label={strings.config['volume-master']}
						onClick={()=> settings.volume.master = -settings.volume.master}
					>
						{conf < 0 ? <MdOutlineVolumeOff aria-label="mute" /> : <MdOutlineVolumeUp aria-label="unmute" />}
					</button>
				</m.div>

				<m.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.7,
						duration: 1,
					}}>
					<TranslationSwitch />
				</m.div>

				<m.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.6,
						duration: 1,
					}}>
					<AppInfo />
				</m.div>
			</div>
		</m.div>
	)
}

export default TitleMenuScreen