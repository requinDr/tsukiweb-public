import { useMemo } from 'react'
import tsukiLogo from "../assets/images/tsukihime-logo.webp"
import moon from "../assets/images/moon.webp"
import '../styles/title-menu.scss'
import { SCREEN } from '../utils/display'
import * as motion from "motion/react-m"
import { continueGame, newGame, savesManager } from '../utils/savestates'
import { viewedScene } from "utils/settings"
import { strings } from "../translation/lang"
import { MdOutlineVolumeOff, MdOutlineVolumeUp } from 'react-icons/md'
import { settings } from '../utils/settings'
import { endings } from '../utils/endings'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import AppInfo from '../components/title-menu/AppInfo'
import TranslationSwitch from '../components/title-menu/TranslationSwitch'
import TitleMenuButton from '../../tsukiweb-common/src/ui-core/components/TitleMenuButton'
import Particles from '@tsukiweb-common/ui-core/components/Particles'
import { useObserved } from '@tsukiweb-common/utils/Observer'
import { useNavigate } from 'react-router-dom'
import history from 'utils/history'

const img = {
	src: moon,
	alt: "moon",
	className: "moon"
}

const TitleMenuScreen = () => {
	const navigate = useNavigate()
	useScreenAutoNavigate(SCREEN.TITLE)
	const [conf] = useObserved(settings.volume, 'master')
	useLanguageRefresh()

	const [allEndingsSeen, eclipseSeen] = useMemo(()=> {
		const allEndingsSeen = settings.unlockEverything || Object.values(endings).every(e=>e.seen)
		const eclipseSeen = settings.unlockEverything || viewedScene("eclipse")
		return [allEndingsSeen, eclipseSeen]
	}, [settings.completedScenes, settings.unlockEverything])

	return (
		<motion.div
			className="page" id="title-menu"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>

			<Particles />

			<div className="logo">
				<motion.img src={img.src} alt={img.alt} draggable={false} className={img.className}
					initial={{ opacity: 0.9, transform: "translateY(-42%) scale(0.9)" }}
					animate={{ opacity: 0.5, transform: "translateY(-50%) scale(1)" }}
					transition={{
						delay: 0,
						duration: 1,
					}} />
				<motion.img
					src={tsukiLogo} alt="tsukihime logo"
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

					{savesManager.savesCount > 0 || history.pagesLength > 0 &&
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

					<TitleMenuButton onClick={() => navigate(SCREEN.GALLERY)} attention={allEndingsSeen && !eclipseSeen}>
						{strings.title.extra}
					</TitleMenuButton>
				</div>
			</nav>

			<div className='top-actions'>
				<motion.div
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
				</motion.div>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.7,
						duration: 1,
					}}>
					<TranslationSwitch />
				</motion.div>

				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						delay: 0.6,
						duration: 1,
					}}>
					<AppInfo />
				</motion.div>
			</div>
		</motion.div>
	)
}

export default TitleMenuScreen