import { CSSProperties, memo, useMemo } from "react"
import GraphicElement from "@tsukiweb-common/graphics/GraphicElement";
import { DivProps, RocketProps, SpritePos } from "@tsukiweb-common/types"
import { ResolutionId } from "@tsukiweb-common/utils/lang";
import { isImage } from "@tsukiweb-common/utils/images";
import { imageSrc } from "../../translation/assets"
import cg from "utils/gallery"


type Props = {
	pos: SpritePos
	image: string
	resolution?: ResolutionId
	rocket?: RocketProps
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
	resolution="src",
	fadeTime=0,
	fadeIn=undefined,
	fadeOut=undefined,
	toImg=undefined,
	onAnimationEnd=undefined,
	rocket,
	style,
	...rest}: Props)=> {
	const getUrl = (img: string) => imageSrc(img, resolution)

//____________________________________image_____________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	const imageProps = useMemo(()=> {
		if (!image) return pos === 'bg' ? {} : null

		if (rocket) {
			return {
				className: 'rocket',
				style: {
					'--rocket-my': `${rocket.my}px`, //maybe vh
					'--rocket-magnify': rocket.magnify,
					'--rocket-duration': `${rocket.time}ms`,
					'--rocket-accel': rocket.accel,
					'--rocket-opacity': rocket.opacity / 255,
				},
				onAnimationEnd: rocket.onAnimationEnd
			}
		}

		// static image
		if (fadeTime === 0) return {}

		// (dis)appearing image
		const fadeAttr =
			fadeIn ? { 'fade-in': fadeIn } :
			fadeOut ? { 'fade-out': fadeOut } :
			{}
		return {
			...fadeAttr,
			style: {
				'--transition-time': `${fadeTime}ms`
			},
			onAnimationEnd
		}
	}, [image, pos, rocket, fadeTime, fadeIn, fadeOut, onAnimationEnd])


//________________________________crossfade mask________________________________
// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
	// add an opaque background to the crossfade-disappearing image to prevent
	// the background from being visible by transparency
	const maskProps = useMemo(()=> {
		if (pos !== 'bg' && fadeTime > 0 && fadeOut === 'crossfade'
				&& image && toImg && isImage(image) && isImage(toImg)) {
			return {
				'for-mask': "",
				style: {
					'--from-image': `url(${imageSrc(image)})`,
					'--to-image': `url(${imageSrc(toImg)})`
				} as CSSProperties
			}
		}
		return null
	}, [pos, fadeTime, fadeOut, image, toImg])

	return (
		<>
			{maskProps &&
				<GraphicElement
					pos={pos}
					image={image}
					getUrl={getUrl}
					blur={cg.shouldBlur}
					props={maskProps}
				/>
			}

			{imageProps &&
				<GraphicElement
					pos={pos}
					image={image}
					getUrl={getUrl}
					blur={cg.shouldBlur}
					props={{
						...rest,
						...imageProps,
						style: { ...imageProps.style, ...style }
					}}
				/>
			}
		</>
	)
}

export default memo(GraphicsElement)