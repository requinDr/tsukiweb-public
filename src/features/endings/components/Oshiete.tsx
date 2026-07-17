import { playScene } from 'engine/savestates'
import chalkboard from '@assets/icons/chalkboard.svg'
import { osiete } from 'features/endings/utils/endings'
import classNames from 'classnames'
import { usePopoverTrigger } from '@tsukiweb/common/flowchart';
import { getSceneGraph } from 'engine/utils';

type Props = {
	unlocked: boolean
	ending: Exclude<typeof osiete[keyof typeof osiete], undefined>
	number: number
}

const Oshiete = ({unlocked, ending, number}: Props) => {
	const graph = ending.scene ? getSceneGraph(ending.scene) : null
	const trigger = usePopoverTrigger({id: ending.scene, name: ending.name, scene: ending.scene, day: ending.day, graph})
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
			onContextMenu={(e) => {e.preventDefault()}}
			nav-auto={unlocked ? 1 : undefined}
			{...(unlocked && trigger)}
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