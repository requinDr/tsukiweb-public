import { SCENE_WIDTH, SCENE_HEIGHT } from "@tsukiweb-common/flowchart"
import { FcNode } from "utils/flowchart"


type SceneImageProps = {
	node: FcNode
}
const SceneImage = ({ node }: SceneImageProps) => {
	const {file, left, top, width, height, nw, nh} = node.metadatas

	if (!file) {
		return <use href="#fc-scene-box" clipPath="url(#fc-scene-clip)" />
	}

	const ratioX = SCENE_WIDTH / width
	const ratioY = SCENE_HEIGHT / height

	return (
		<image
			href={file}
			x={-ratioX * left - SCENE_WIDTH / 2}
			y={-ratioY * top - SCENE_HEIGHT / 2}
			width={nw * ratioX}
			height={nh * ratioY}
			preserveAspectRatio="none"
			clipPath="url(#fc-scene-clip)"
		/>
	)
}

export default SceneImage
