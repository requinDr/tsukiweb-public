import { memo, useCallback, CSSProperties } from "react"
import { imageSrc } from "../../translation/assets"
import { settings } from "../../utils/settings"
import GraphicElement from "@tsukiweb-common/components/atoms/GraphicElement"
import { DivProps, SpritePos } from "@tsukiweb-common/types"
import { shouldBlur } from "utils/gallery"

function getUrl(resolution: typeof settings.resolution, image: string): string {
	return imageSrc(image, resolution)
}

type Props = {
	pos: SpritePos
	image: string
	resolution?: typeof settings.resolution
} & ({
	fadeIn?: undefined
	fadeOut?: undefined
	fadeTime?: 0
	toImg?: undefined
	onAnimationEnd?: undefined
} | (
	{ fadeTime: number, onAnimationEnd: VoidFunction } & (
		{ fadeIn: string, fadeOut?: undefined, toImg?: undefined } |
		{ fadeOut: string, fadeIn?: undefined, toImg: string }
	)
)) & DivProps

const GraphicsElement = ({
	pos,
	image,
	resolution=settings.resolution,
	fadeTime=0,
	fadeIn=undefined,
	fadeOut=undefined,
	toImg=undefined,
	onAnimationEnd=undefined,
	...props} : Props)=> {

//____________________________________image_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	const imageProps = useCallback(()=> {
//.............. no image ..............
		if (!image) {
			return pos == 'bg' ? {} : undefined
		}
//............ static image ............
		else if (fadeTime == 0) {
			return {}
		}
//........ (dis)appearing image ........
		else {
			return {
				...(fadeIn ? {'fade-in' : fadeIn}
					: fadeOut ? {'fade-out': fadeOut} : {}),
					style: {
						'--transition-time': `${fadeTime}ms`
					},
				onAnimationEnd
			}
		}
	}, [pos, image, fadeTime, fadeIn, fadeOut])()

//________________________________crossfade mask________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// add an opaque background to the crossfade-disappearing image to prevent
	// the background from being visible by transparency
	const maskProps = useCallback(()=> {
		if (pos != 'bg' && fadeTime > 0 && fadeOut == 'crossfade'
				&& image && toImg && isImage(image) && isImage(toImg)) {
			return {
				'for-mask': "",
				style: {
					'--from-image': `url(${imageSrc(image)})`,
					'--to-image': `url(${imageSrc(toImg)})`
				} as CSSProperties
			}
		}

	}, [pos, image, toImg, fadeOut, fadeTime])()


	const {style: baseStyle = {}, ...baseAttrs} = (imageProps || {})  as DivProps
	const {style: insertStyle = {}, ...insertAttrs} = props

	return (
		<>
			{maskProps != undefined &&
				<GraphicElement
					pos={pos}
					image={image}
					getUrl={getUrl.bind(undefined, resolution)}
					blur={shouldBlur}
					props={maskProps}
				/>
			}

			{imageProps != undefined &&
				<GraphicElement
					pos={pos}
					image={image}
					getUrl={getUrl.bind(undefined, resolution)}
					blur={shouldBlur}
					props={{
						style: {...baseStyle, ...insertStyle},
						...baseAttrs,
						...insertAttrs
					}}
				/>
			}
		</>
	)
}

export default memo(GraphicsElement)

function isImage(str: string) {
	const c = str.charAt(0)
	return c != '#' && c != '$'
}