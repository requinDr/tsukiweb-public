import { useEffect } from 'react'
import '../styles/title-menu.scss'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { strings } from '../translation/lang'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { SCREEN } from 'utils/display'
import { bb } from '@tsukiweb-common/utils/Bbcode'

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
			// initial={{opacity: 0}}
			// animate={{opacity: 1}}
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
