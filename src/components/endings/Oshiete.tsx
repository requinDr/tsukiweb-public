import { playScene } from 'utils/savestates'
import chalkboard from '@assets/icons/chalkboard.svg'
import { noBb } from '@tsukiweb-common/utils/Bbcode'
import { osiete } from 'utils/endings'
import classNames from 'classnames'
import { useScenePopover, useScenePopoverTrigger } from 'components/flowchart/ScenePopoverContext'
import { useCallback } from 'react'

type Props = React.HTMLAttributes<HTMLDivElement> & {
	unlocked: boolean
	ending: typeof osiete[keyof typeof osiete]
	number: number
}

const Oshiete = ({unlocked, ending, number, ...props}: Props) => {
	const { closePopover } = useScenePopover()
	const trigger = useScenePopoverTrigger(ending?.scene)

	const onAction = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
		if ('key' in e && (e.key !== "Enter" || e.currentTarget !== e.target)) {
			return
		}
		e.stopPropagation()
		closePopover()
		if (unlocked && ending)
			playScene(ending.scene, {continueScript: false })
	}, [closePopover, unlocked, ending])

	return (
		<div
			{...props}
			className={classNames("badending", {"seen": unlocked})}
			tabIndex={unlocked ? 0 : -1}
			role="button"
			{...(unlocked && trigger)}
			onClick={unlocked ? onAction : undefined}
			onKeyDown={unlocked ? onAction : undefined}
			onContextMenu={(e) => {e.preventDefault()}}
		>
			{unlocked && ending ?
				<img
					src={chalkboard}
					alt="Green chalkboard icon"
					draggable={false}
				/>
			:
				<img
					src={chalkboard}
					alt="Green chalkboard icon greyed out"
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