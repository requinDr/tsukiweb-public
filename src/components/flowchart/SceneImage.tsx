import { FcNode, SCENE_WIDTH, SCENE_HEIGHT } from "utils/flowchart"


type SceneImageProps = {
	node: FcNode
}
const SceneImage = ({ node }: SceneImageProps) => {
	const {file, left, top, width, height, nw, nh} = node.metadatas

	if (!file) {
		return <use href="#fc-scene-box" />
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
		/>
	)
}

export default SceneImage
