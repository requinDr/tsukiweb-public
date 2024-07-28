import '../styles/endings.scss'
import { motion } from 'framer-motion'
import { strings } from '../translation/lang'
import { imageSrc } from '../translation/assets'
import { SCREEN } from '../utils/display'
import chalkboard from '../assets/images/chalkboard.webp'
import { RouteEnding, endings, osiete } from '../utils/endings'
import { Tooltip } from 'react-tooltip'
import ReactDOMServer from 'react-dom/server';
import { playScene } from '../utils/savestates'
import { useLanguageRefresh } from '../components/hooks/useLanguageRefresh'
import { useScreenAutoNavigate } from '../components/hooks/useScreenAutoNavigate'
import PageSection from '@tsukiweb-common/ui-core/layouts/PageSection'
import { settings } from 'utils/settings'
import { noBb } from '@tsukiweb-common/utils/Bbcode'
import Button from '@tsukiweb-common/ui-core/components/Button'


const EndingsScreen = () => {
	useScreenAutoNavigate(SCREEN.ENDINGS)
	useLanguageRefresh()

	return (
		<motion.div
			className="page" id="endings"
			initial={{opacity: 0}}
			animate={{opacity: 1}}
			exit={{opacity: 0}}>
			<div className="page-content">
				<h2 className="page-title">{strings.extra.endings}</h2>
				
				<main>
					<PageSection className="endings-list">
					{Object.values(endings).map((ending, index) => {
						if (ending.seen || settings.unlockEverything) {
							return <EndingComponent ending={ending} key={index} />
						} else {
							return <div key={index} className="ending" />
						}
					})}
					</PageSection>

					<PageSection className="badendings-list">
						<h3>{strings.endings.osiete}</h3>
						<Tooltip id="osiete" place="top" className="tooltip" />
						{Object.values(osiete).map((ending, index)=>
							<Oshiete key={index} ending={ending} />
						)}
					</PageSection>
				</main>

				<Button
					variant="menu"
					to={SCREEN.TITLE}
					className="back-button">
					{strings.back}
				</Button>
			</div>
		</motion.div>
	)
}

export default EndingsScreen

const EndingComponent = ({ending:{char, image, name, day, type}}: {ending: RouteEnding}) => {
	return (
		<div className={`ending ${char}`}>
			<img className="ending-img"
				src={imageSrc(`event/${image}`, 'thumb')}
				alt={name} draggable={false} />
			
			<div className="ending-desc">
				<div className="ending-name">
					{noBb(strings.scenario.routes[char][day])}
				</div>
				
				<div className="ending-bottom">
					<div>
						{strings.characters[char]}
					</div>

					<div className="ending-type">
						({type})
					</div>
				</div>
			</div>
		</div>
	)
}

const Oshiete = ({ending}: {ending: typeof osiete[keyof typeof osiete]}) => {
	const show = settings.unlockEverything || ending?.seen
	return (
		<div className={`badending ${show ? 'seen' : ''}`}>
			{show && ending ?
				<img
					src={chalkboard}
					alt={`Bad Ending ${ending.scene}`}
					draggable={false}
					onClick={() => playScene(ending.scene, {continueScript: false })}
					data-tooltip-id="osiete"
					data-tooltip-html={ReactDOMServer.renderToStaticMarkup(
					<div>
						{ending.name && <>{noBb(ending.name)}<br /></>}
						{ending.day && <>Day: {ending.day}<br /></>}
						{ending.scene}
					</div>)} />
			: <img src={chalkboard} alt="Bad Ending" draggable={false} />
			}
		</div>
	)
}