import ExtraMenu from "components/title-menu/ExtraMenu"
import { motion } from "framer-motion"
import { PropsWithChildren } from "react"
import "../styles/extra.scss"
import TitleMenuButton from "@tsukiweb-common/components/atoms/TitleMenuButton"
import { strings } from "translation/lang"
import { SCREEN } from "utils/display"
import { playScene } from "utils/savestates"

const ExtraLayout = ({ children }: PropsWithChildren) => {
	const allEndingsSeen = true
	const eclipseSeen = false

	function playEClipse() {
		playScene("eclipse", {continueScript: true, viewedOnly: false})
	}
	
	return (
		<div
			id="extra"
			className="page-content">
			<div
				className="extra-menu">
				<TitleMenuButton to={SCREEN.GALLERY}>
					{strings.extra.gallery}
				</TitleMenuButton>
				<TitleMenuButton to={SCREEN.ENDINGS}>
					{strings.extra.endings}
				</TitleMenuButton>
				<TitleMenuButton to={SCREEN.SCENES}>
					{strings.extra.scenes}
				</TitleMenuButton>
				{allEndingsSeen &&
				<TitleMenuButton onClick={playEClipse}
					attention={!eclipseSeen}>
					{strings.extra.eclipse}
				</TitleMenuButton>
				}
				<TitleMenuButton to={SCREEN.TITLE}>
					{`<`}	{strings.back}
				</TitleMenuButton>
			</div>

			<motion.div
				className="extra-content"
				initial={{y: -10, opacity: 0}}
				animate={{y: 0, opacity: 1}}
				exit={{y: 20, opacity: 0}}
				transition={{duration: 0.2}}
			>
				{children}
			</motion.div>
		</div>
	)
}

export default ExtraLayout