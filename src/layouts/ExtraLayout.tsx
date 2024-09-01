import { AnimatePresence, motion } from "framer-motion"
import { PropsWithChildren, useMemo } from "react"
import "../styles/extra.scss"
import TitleMenuButton from "@tsukiweb-common/components/atoms/TitleMenuButton"
import { strings } from "translation/lang"
import { SCREEN } from "utils/display"
import { playScene, viewedScene } from "utils/savestates"
import { useLocation } from "react-router-dom"
import { useLanguageRefresh } from "components/hooks/useLanguageRefresh"
import { endings } from "utils/endings"
import { settings } from "utils/settings"
import classNames from "classnames"

const ExtraLayout = ({ children }: PropsWithChildren) => {
	const location = useLocation()
	useLanguageRefresh()

	const [allEndingsSeen, eclipseSeen] = useMemo(()=> {
		const allEndingsSeen = settings.unlockEverything || Object.values(endings).every(e=>e.seen)
		const eclipseSeen = settings.unlockEverything || viewedScene("eclipse")
		return [allEndingsSeen, eclipseSeen]
	}, [settings.completedScenes, settings.unlockEverything])

	function playEClipse() {
		playScene("eclipse", {continueScript: true, viewedOnly: false})
	}

	const currentPage = "/" + location.pathname.split("/")[1]

	return (
		<motion.div
			id="extra"
			className="page-content"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<div
				className="extra-menu">
				<TitleMenuButton to={SCREEN.GALLERY} className={classNames({active: currentPage === SCREEN.GALLERY})}>
					{strings.extra.gallery}
				</TitleMenuButton>
				<TitleMenuButton to={SCREEN.ENDINGS} className={classNames({active: currentPage === SCREEN.ENDINGS})}>
					{strings.extra.endings}
				</TitleMenuButton>
				<TitleMenuButton to={SCREEN.SCENES} className={classNames({active: currentPage === SCREEN.SCENES})}>
					{strings.extra.scenes}
				</TitleMenuButton>
				{allEndingsSeen &&
				<TitleMenuButton onClick={playEClipse}
					attention={!eclipseSeen}>
					{strings.extra.eclipse}
				</TitleMenuButton>
				}
				<TitleMenuButton to={SCREEN.TITLE}>
					{`<<`} {strings.back}
				</TitleMenuButton>
			</div>

			<motion.div
				className="extra-content"
				initial={{y: -10, opacity: 0.4}}
				animate={{y: 0, opacity: 1}}
				exit={{y: 20, opacity: 0}}
				transition={{duration: 0.2}}
				key={location.pathname}
			>
				{children}
			</motion.div>
		</motion.div>
	)
}

export default ExtraLayout