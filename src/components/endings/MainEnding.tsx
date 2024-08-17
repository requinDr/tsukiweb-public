import { noBb } from "@tsukiweb-common/utils/Bbcode"
import classNames from "classnames"
import { imageSrc } from "translation/assets"
import { strings } from "translation/lang"
import { RouteEnding } from "utils/endings"

type Props = {
	unlocked: boolean
	ending: RouteEnding
}

const MainEnding = ({unlocked, ending:{char, image, name, day, type}}: Props) => {
	return (
		<div className={classNames("ending", char, {"unlocked": unlocked})}>
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
					{unlocked ? noBb(strings.scenario.routes[char][day]) : "???"}
				</div>
				
				<div className="ending-bottom">
					{unlocked ?
					<>{strings.characters[char]} {`\u2022`} {type}</>
					:
					"???"
					}
				</div>
			</div>
		</div>
	)
}

export default MainEnding