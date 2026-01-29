import { useEffect } from 'react'
import '@styles/title-menu.scss'
import * as m from "motion/react-m"
import { useLocation } from "wouter"
import { strings } from '../translation/lang'
import { SCREEN } from 'utils/display'
import { bb } from '@tsukiweb-common/utils/Bbcode'
import { useLanguageRefresh } from 'hooks'

const DisclaimerScreen = ({ onAccept }: { onAccept?: () => void }) => {
	const [, setLocation] = useLocation()
	useLanguageRefresh()

	useEffect(()=> {
		const timeout = setTimeout(()=> {
			sawDisclaimer()
		}, 4000)
		return ()=> clearTimeout(timeout)
	}, [])

	useEffect(()=> {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Enter') sawDisclaimer()
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [])

	const sawDisclaimer = () => {
		delete document.documentElement.dataset.preloading
		if (onAccept) onAccept()
		setLocation(SCREEN.TITLE)
	}

	return (
		<m.div
			className="page" id="disclaimer"
			exit={{opacity: 0, transition: {duration: 1}}}
			onClick={sawDisclaimer}
		>
			<div className="box">
				{strings.disclaimer.map((txt, i) =>
					<p key={i}>{bb(txt)}</p>
				)}
				<div className='decorator' />
			</div>
		</m.div>
	)
}

export default DisclaimerScreen
