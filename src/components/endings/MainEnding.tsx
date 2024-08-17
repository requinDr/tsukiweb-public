import { noBb } from "@tsukiweb-common/utils/Bbcode"
import { imageSrc } from "translation/assets"
import { strings } from "translation/lang"
import { RouteEnding } from "utils/endings"

type Props = {
	ending: RouteEnding
}

const MainEnding = ({ending:{char, image, name, day, type}}: Props) => {
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

export default MainEnding