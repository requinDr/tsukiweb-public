import classNames from "classnames"
import { imageSrc } from "translation/assets"

type Props = {
	unlocked: boolean
	ending: {
		id: string
		char: string
		image: string
		name: string
		type: string
	}
}

const MainEnding = ({unlocked, ending:{id, char, image, name, type}}: Props) => {
	return (
		<div className={classNames("ending", id, {"unlocked": unlocked})}>
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
					<>{char} {`\u2022`} {type}</>
					: unlocked && !char ? "" :
					"???"
					}
				</div>
			</div>
		</div>
	)
}

export default MainEnding