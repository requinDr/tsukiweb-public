import { memo } from "react"
import { settings } from "../../utils/settings"
import { imageSrc } from "../../translation/assets"
import { POSITIONS } from "@tsukiweb-common/constants";
import { SpritePos, Graphics as GraphicsType, DivProps } from "@tsukiweb-common/types";
import cg from "utils/gallery";
import { useLanguageRefresh } from "hooks";
import GraphicElement from "@tsukiweb-common/graphics/GraphicElement";
import { avif } from "@tsukiweb-common/utils/images";


export async function preloadImage(src: string, resolution = settings.resolution): Promise<void> {
	if (src.startsWith('#') || src.startsWith('$'))
		return
	if (src.startsWith('"'))
		src = src.replaceAll('"', '')
	if (avif.isSupported === null) {
		await avif.testSupport()
	}
	
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = resolve as VoidFunction
		img.onerror = img.onabort = reject

		if (avif.isSupported) {
			img.src = avif.replaceExtension(imageSrc(src, resolution))
		} else {
			img.src = imageSrc(src, resolution)
		}
	})
}

type GraphicsGroupProps = {
	images: Partial<GraphicsType>
	spriteAttrs?: Partial<Record<SpritePos, DivProps>> | ((pos:SpritePos)=>DivProps)
	resolution?: typeof settings.resolution,
	lazy?: boolean,
} & DivProps

function getUrl(resolution: typeof settings.resolution, image: string): string {
	return imageSrc(image, resolution)
}

const GraphicsGroup = ({
	images,
	spriteAttrs,
	resolution = settings.resolution,
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
					blur={cg.shouldBlur(cg.getNameFromPath(images[pos] ?? ''))}
					lazy={lazy}
				/>
			)}
		</div>
	)
}

export default memo(GraphicsGroup)