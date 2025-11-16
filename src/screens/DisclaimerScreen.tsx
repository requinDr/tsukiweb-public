import { useEffect } from 'react'
import '@styles/title-menu.scss'
import * as motion from "motion/react-m"
import { useNavigate } from "react-router"
import { strings } from '../translation/lang'
import { SCREEN } from 'utils/display'
import { bb } from '@tsukiweb-common/utils/Bbcode'
import { useLanguageRefresh } from 'hooks'

const DisclaimerScreen = ({ onAccept }: { onAccept?: () => void }) => {
	const navigate = useNavigate()
	useLanguageRefresh()

	useEffect(()=> {
		const timeout = setTimeout(()=> {
			sawDisclaimer()
		}, 4000)
		return ()=> clearTimeout(timeout)
	}, [])

	const sawDisclaimer = () => {
		if (onAccept) onAccept()
		navigate(SCREEN.TITLE)
	}

	return (
		<motion.div
			className="page" id="disclaimer"
			exit={{opacity: 0, transition: {duration: 1}}}
			onClick={sawDisclaimer}
		>
			<div className="box">
				{strings.disclaimer.map((txt, i) =>
					<p key={i}>{bb(txt)}</p>
				)}
			</div>
		</motion.div>
	)
}

export default DisclaimerScreen
