import { memo } from "react"
import { settings } from "../../utils/settings"
import GraphicElement from "../atoms/GraphicElement"
import { imageSrc } from "../../translation/assets"
import { DivProps } from "../../types";
import { POSITIONS } from "@tsukiweb-common/constants";
import { SpritePos, Graphics as GraphicsType } from "@tsukiweb-common/types";


export async function preloadImage(src:string, resolution=settings.resolution): Promise<void> {
	if (src.startsWith('#') || src.startsWith('$'))
		return
	else {
		return new Promise((resolve, reject)=> {
			const img = new Image()
			img.onload = resolve as VoidFunction
			img.onerror = img.onabort = reject
			img.src = imageSrc(src, resolution)
		})
	}
}

type GraphicsGroupProps = {
	images: GraphicsType
	spriteAttrs?: Partial<Record<SpritePos, DivProps>> | ((pos:SpritePos)=>DivProps)
	resolution?: typeof settings.resolution,
	lazy?: boolean,
} & DivProps

const GraphicsGroup = ({
	images,
	spriteAttrs,
	resolution = settings.resolution,
	lazy=false,
	...props}: GraphicsGroupProps)=> {
	const monochrome = images.monochrome ?? ""
	let {style, className, ...attrs} = props
	const classes = ['graphics']
	if (monochrome) {
		classes.push('monochrome')
		if (!style)
			style = {}
		style = {
			...style,
			...{'--monochrome-color': monochrome}
		}
	}
	if (className)
		classes.push(className)

	return (
		<div className={classes.join(' ')} style={style} {...attrs}>
			{POSITIONS.map(pos => images[pos] &&
				<GraphicElement key={images[pos]||pos}
					pos={pos}
					image={images[pos] as string} {...(typeof spriteAttrs == 'function' ? spriteAttrs(pos)
							: spriteAttrs?.[pos] ?? {})}
					resolution={resolution}
					lazy={lazy}
				/>
			)}
		</div>
	)
}

export default memo(GraphicsGroup)