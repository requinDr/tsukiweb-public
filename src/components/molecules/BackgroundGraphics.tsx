import { memo } from "react"
import { displayMode } from "../../utils/display"
import GraphicsElement from "./GraphicsElement"
import { useObserved } from "@tsukiweb-common/utils/Observer"

type Props = {
	image: string
}
const BackgroundGraphics = ({image}: Props)=> {
	const [bgAlign] = useObserved(displayMode, 'bgAlignment')
	return (
		<GraphicsElement key={image}
			pos='bg'
			image={image}
			bg-align={bgAlign}
		/>
	)
}

export default memo(BackgroundGraphics)