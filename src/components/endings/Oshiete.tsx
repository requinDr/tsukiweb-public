import { playScene } from 'utils/savestates'
import chalkboard from '../../assets/images/chalkboard.webp'
import ReactDOMServer from 'react-dom/server'
import { noBb } from '@tsukiweb-common/utils/Bbcode'
import { osiete } from 'utils/endings'
import classNames from 'classnames'

type Props = {
	unlocked: boolean
	ending: typeof osiete[keyof typeof osiete]
}

const Oshiete = ({unlocked, ending}: Props) => {

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
		>
			{unlocked && ending ?
				<img
					src={chalkboard}
					alt={`Chalkboard Bad Ending ${ending.scene}`}
					draggable={false}
					data-tooltip-id="osiete"
					data-tooltip-html={
						ReactDOMServer.renderToString(
							<Tooltip ending={ending} />
						)
					}
				/>
			:
				<img
					src={chalkboard}
					alt="Bad Ending"
					draggable={false}
				/>
			}
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
			{ending.name && <>{noBb(ending.name)}<br /></>}
			{ending.day && <>Day: {ending.day}<br /></>}
			{ending.scene}
		</div>
	)
}