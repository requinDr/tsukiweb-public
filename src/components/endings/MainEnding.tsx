import classNames from "classnames"
import { imageSrc } from "translation/assets"
import { LabelName } from "types"
import { playScene } from "utils/savestates"

type Props = {
	unlocked: boolean
	ending: {
		id: string
		char: string
		image: string
		name: string
		type: string
		scene: LabelName
	}
}

const MainEnding = ({unlocked, ending:{id, char, image, name, type, scene}}: Props) => {
	const startScene = () => playScene(scene, {continueScript: false, viewedOnly: true})

	return (
		<div
			className={classNames("ending", id, {"unlocked": unlocked})}
			onClick={startScene}
			tabIndex={unlocked ? 0 : -1}
			role="button"
			onKeyDown={(e)=> e.key === "Enter" && startScene()}
		>
			{unlocked ?
			<img
				className="ending-img"
				src={imageSrc(`event/${image}`, 'sd')}
				alt={name} draggable={false} />
			:
			<div className="ending-img placeholder" />
			}
			
			<div className="ending-desc">
				<div className="ending-name">
					{unlocked ? name : "???"}
				</div>
				
				<div className="ending-bottom">
					{unlocked && char ?
					<>{char} <span className="separator">{`\u2022`}</span> {type}</>
					: unlocked && !char ? "" :
					"???"
					}
				</div>
			</div>
		</div>
	)
}

export default MainEnding