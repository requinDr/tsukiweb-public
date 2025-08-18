import { Graphics } from "@tsukiweb-common/types"
import GraphicsGroup from "components/molecules/GraphicsGroup"
import { ReactNode } from "react"

type SceneProps = {
	title: ReactNode
	images: Partial<Graphics>
	viewed: boolean
	onClick?: ()=>void
}
const SceneShortcut = ({title, images, viewed, onClick}: SceneProps) => {
	return (
		<div className="scene" onClick={onClick} role="button" tabIndex={0}>
			<GraphicsGroup
				images={images}
				resolution="sd"
				className='scene-image'
			/>
			<div className="scene-title">
				{title}<br />
				{viewed && <span className="viewed-indicator">Viewed</span>}
			</div>
		</div>
	)
}

export default SceneShortcut