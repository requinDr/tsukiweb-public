import { playScene } from 'utils/savestates'
import chalkboard from '@assets/icons/chalkboard.svg'
import { noBb } from '@tsukiweb-common/utils/Bbcode'
import { osiete } from 'utils/endings'
import classNames from 'classnames'

type Props = React.HTMLAttributes<HTMLDivElement> & {
	unlocked: boolean
	ending: typeof osiete[keyof typeof osiete]
	number: number
}

const Oshiete = ({unlocked, ending, number, ...props}: Props) => {

	const handlePlay = () => {
		if (unlocked && ending)
			playScene(ending.scene, {continueScript: false })
	}

	return (
		<div
			{...props}
			className={classNames("badending", {"seen": unlocked})}
			tabIndex={unlocked ? 0 : -1}
			role="button"
			onClick={unlocked ? handlePlay : undefined}
			onKeyDown={e => e.key === 'Enter' && handlePlay()}
			onContextMenu={(e) => {e.preventDefault()}}
			data-tooltip-id="osiete"
			data-tooltip-html={`
				${ending?.scene}<br />
				${ending?.name ? `${noBb(ending.name)}, Day: ${ending.day}` : ""}
			`}
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