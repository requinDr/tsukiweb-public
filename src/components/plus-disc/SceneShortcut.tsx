import { Graphics } from "@tsukiweb-common/types"
import GraphicsGroup from "components/molecules/GraphicsGroup"
import { ReactNode } from "react"

type SceneProps = {
	title: ReactNode
	images: Partial<Graphics>
	onClick?: ()=>void
}
const SceneShortcut = ({title, images, onClick}: SceneProps) => {
	return (
		<div className="scene" onClick={onClick}>
			<GraphicsGroup
				images={images}
				resolution="sd"
				className='scene-image'
			/>
			<div className="scene-title">
				{title}
			</div>
		</div>
	)
}

export default SceneShortcut