import { memo } from "react"
import { imageSrc } from "../../translation/assets"
import { POSITIONS } from "@tsukiweb-common/constants";
import { SpritePos, Graphics as GraphicsType, DivProps } from "@tsukiweb-common/types";
import cg from "utils/gallery";
import { useLanguageRefresh } from "hooks";
import GraphicElement from "@tsukiweb-common/graphics/GraphicElement";
import { ResolutionId } from "@tsukiweb-common/utils/lang";


export async function preloadImage(src: string, resolution: ResolutionId = "src"): Promise<void> {
	if (src.startsWith('#') || src.startsWith('$'))
		return
	if (src.startsWith('"'))
		src = src.replaceAll('"', '')
	
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = resolve as VoidFunction
		img.onerror = img.onabort = reject

		img.src = imageSrc(src, resolution)
	})
}

type GraphicsGroupProps = {
	images: Partial<GraphicsType>
	spriteAttrs?: Partial<Record<SpritePos, DivProps>> | ((pos:SpritePos)=>DivProps)
	resolution?: ResolutionId,
	lazy?: boolean,
} & DivProps

function getUrl(resolution: ResolutionId, image: string): string {
	return imageSrc(image, resolution)
}

const GraphicsGroup = ({
	images,
	spriteAttrs,
	resolution = "src",
	lazy = false,
	...props}: GraphicsGroupProps)=> {
	useLanguageRefresh(true)
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
				<GraphicElement
					key={pos}
					pos={pos}
					image={images[pos] ?? ''} {...(typeof spriteAttrs == 'function' ? spriteAttrs(pos)
							: spriteAttrs?.[pos] ?? {})}
					getUrl={getUrl.bind(undefined, resolution)}
					blur={cg.shouldBlur(images[pos] ?? '')}
					lazy={lazy}
				/>
			)}
		</div>
	)
}

export default memo(GraphicsGroup)