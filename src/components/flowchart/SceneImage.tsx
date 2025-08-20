import { SyntheticEvent } from "react"
import { FcNode, SCENE_WIDTH, SCENE_HEIGHT } from "utils/flowchart"


function onImgLoad(top: number, left: number, width: number, height: number,
					 evt: SyntheticEvent<HTMLImageElement, Event>) {
	const img = evt.target as HTMLImageElement
	const ratio_x = SCENE_WIDTH / width
	const ratio_y = SCENE_HEIGHT / height
	img.style.marginLeft = `-${ratio_x * left}px`,
	img.style.marginTop  = `-${ratio_y * top}px`
	img.style.width      = `${img.naturalWidth * ratio_x}px`
	img.style.height     = `${img.naturalHeight * ratio_y}px`
	img.classList.add('loaded')
}


type SceneImageProps = {
	node: FcNode
}
const SceneImage = ({ node }: SceneImageProps) => {
	const {file, left, top, width, height} = node.metadatas
	if (file) {
		return (<>
			<foreignObject
				x={-SCENE_WIDTH/2} y={-SCENE_HEIGHT/2}
				width={SCENE_WIDTH} height={SCENE_HEIGHT}
			>
				<img
					onLoad={onImgLoad.bind(null, top, left, width, height)}
					src={file}
					alt={`Thumbnail for ${node.id}`}
				/>
			</foreignObject>
			<use href="#fc-scene-outline"/>
		</>)
	} else {
		return <>
			<use href="#fc-scene-background" />
			<use href="#fc-scene-outline"/>
		</>
	}
}

export default SceneImage
