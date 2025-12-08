import { Graphics } from "@tsukiweb-common/types"
import GraphicsGroup from "components/molecules/GraphicsGroup"
import { ReactNode } from "react"
import { strings } from "translation/lang"

type SceneProps = React.HTMLAttributes<HTMLDivElement> & {
	title: ReactNode
	images: Partial<Graphics>
	viewed: boolean
	onClick?: ()=>void
}
const SceneShortcut = ({title, images, viewed, onClick, ...props}: SceneProps) => {
	return (
		<div {...props} className="scene" onClick={onClick} onContextMenu={(e) => {e.preventDefault()}} role="button" tabIndex={0}>
			<GraphicsGroup
				images={images}
				resolution="thumb"
				className='scene-image'
			/>
			<div className="scene-title">
				{title}<br />
				{viewed && <span className="viewed-indicator">{strings.plus_disc.viewed}</span>}
			</div>
		</div>
	)
}

export default SceneShortcut