import { SyntheticEvent } from "react"
import { FcNode, SCENE_WIDTH, SCENE_HEIGHT } from "utils/flowchart"


function onImgLoad(top: number, left: number, width: number, height: number,
					 evt: SyntheticEvent<HTMLImageElement, Event>) {
	const img = evt.target as HTMLImageElement
	const imgWidth = img.naturalWidth
	const imgHeight = img.naturalHeight
	const ratio_x = SCENE_WIDTH / width
	const ratio_y = SCENE_HEIGHT / height
	img.style.marginLeft = `-${ratio_x * left}px`,
	img.style.marginTop  = `-${ratio_y * top}px`
	img.style.width      = `${imgWidth * ratio_x}px`
	img.style.height     = `${imgHeight * ratio_y}px`
	img.style.opacity = '1'
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
					style={{ opacity: 0, transition: "opacity .2s" }}
				/>
			</foreignObject>
			<use href="#fc-scene-outline"/>
		</>)
	} else {
		return <>
			<use href="#fc-scene-background" />
			<text className="fc-scene-title">{node.id}</text>
			<use href="#fc-scene-outline"/>
		</>
	}
}

export default SceneImage
