import { playScene } from 'utils/savestates'
import chalkboard from '../../assets/images/chalkboard.webp'
import ReactDOMServer from 'react-dom/server'
import { noBb } from '@tsukiweb-common/utils/Bbcode'
import { osiete } from 'utils/endings'
import classNames from 'classnames'

type Props = {
	unlocked: boolean
	ending: typeof osiete[keyof typeof osiete]
	number: number
}

const Oshiete = ({unlocked, ending, number}: Props) => {

	const handlePlay = () => {
		if (unlocked && ending)
			playScene(ending.scene, {continueScript: false })
	}

	return (
		<div
			className={classNames("badending", {"seen": unlocked})}
			tabIndex={unlocked ? 0 : -1}
			role="button"
			onClick={unlocked ? handlePlay : undefined}
			onKeyDown={e => e.key === 'Enter' && handlePlay()}
			data-tooltip-id="osiete"
			data-tooltip-html={
				unlocked ? ReactDOMServer.renderToString(
					<Tooltip ending={ending} />
				)
				: undefined
			}
		>
			{unlocked && ending ?
				<img
					src={chalkboard}
					alt={`Chalkboard`}
					draggable={false}
				/>
			:
				<img
					src={chalkboard}
					alt="Chalkboard locked"
					draggable={false}
				/>
			}

			<div className='label'>
				{number}
			</div>
		</div>
	)
}

export default Oshiete

type TooltipProps = {
	ending: typeof osiete[keyof typeof osiete]
}
const Tooltip = ({ending}: TooltipProps) => {
	if (!ending) return null

	return (
		<div>
			{ending?.scene}<br />
			{ending.name && <>{noBb(ending.name)}<br /></>}
			{ending.day && <>Day: {ending.day}<br /></>}
		</div>
	)
}