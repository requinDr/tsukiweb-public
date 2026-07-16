import { useEffect } from 'react'
import '@features/title-menu/styles/title-menu.scss'
import * as m from "motion/react-m"
import { useStrings } from 'translation/lang';

const DisclaimerScreen = ({ onAccept }: { onAccept?: () => void }) => {
	const strings = useStrings()

	useEffect(()=> {
		const timeout = setTimeout(()=> {
			dismissDisclaimer()
		}, 10000)
		return ()=> clearTimeout(timeout)
	}, [])

	useEffect(()=> {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Enter') dismissDisclaimer()
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [])

	const dismissDisclaimer = () => {
		delete document.documentElement.dataset.preloading
		if (onAccept) onAccept()
	}

	return (
		<m.div
			className="page" id="disclaimer"
			exit={{opacity: 0, transition: {duration: 1}}}
			onClick={dismissDisclaimer}
			style={{ position: 'fixed', inset: 0, zIndex: 100 }}
		>
			<div className="box">
				{strings.disclaimer.map((txt, i) =>
					<p key={i}>{txt}</p>
				)}
				<div className='decorator' />
			</div>
		</m.div>
	)
}

export default DisclaimerScreen
