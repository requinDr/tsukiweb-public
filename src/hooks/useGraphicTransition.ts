import { useState, useRef, useEffect } from "react";
import { GraphicsTransition, SpritePos } from "@tsukiweb-common/types";
import { splitFirst } from "@tsukiweb-common/utils/utils";
import { isImage, preloadImage } from "@tsukiweb-common/utils/images";
import { imageSrc } from "translation/assets";


type GraphicTransitionResult = {
	img: string
	prev: undefined
	duration?: undefined
	effect?: undefined
	onAnimationEnd?: undefined
} | {
	img: string,
	prev: string
	duration: number
	effect: string
	onAnimationEnd: VoidFunction
}

function useGraphicTransition(
	pos: SpritePos,
	image: string,
	transition?: GraphicsTransition
): GraphicTransitionResult {
	const [currImg, setCurrImg] = useState<string>(image)
	const prevImg = useRef<string>(image)
	const onEnd = useRef<VoidFunction>(undefined)
	const [loaded, setLoaded] = useState(true)
	const [state, setState] = useState<{duration: number, effect: string}>({duration: 0, effect: ""})

	useEffect(()=> {
		const {
			duration = 0,
			effect,
			onFinish,
			to: {[pos]: transImg = undefined} = {}
		} = transition ?? {}
		let load = false
		if (transImg != undefined && transImg != currImg) {
			//console.debug(`${pos}: ${currImg} --> ${transImg} (${effect}, ${duration})`)
			setState({duration, effect: effect!})
			prevImg.current = currImg
			setCurrImg(transImg)
			load = true
			onEnd.current = ()=> {
				onEnd.current = undefined
				setState({duration: 0, effect: ""})
				onFinish?.()
			}
		} else {
			if (image != currImg) {
				//console.debug(`${pos}: ${currImg} --> ${image}`)
				if (loaded) // keep previous image if current one not loaded
					prevImg.current = currImg
				setCurrImg(image)
				load = true
			}
			if (state.duration > 0 || state.effect.length > 0) { //transition on other position
				setState({duration: 0, effect: ""})
			}
		}

		if (load) {
			const loadImage = transImg ?? image
			let src = splitFirst(loadImage, '$')[0]
			if (!isImage(src)) {
				if (duration == 0)
					onEnd.current?.()
				return
			}
			if (src.startsWith('"'))
				src = src.replaceAll('"', '')

			if (src.length > 0) {
				setLoaded(false)
				preloadImage(imageSrc(src))
					.finally(()=> {
						setLoaded(true)
						if (onEnd.current && duration == 0)
							onEnd.current()
					})
			} else if (duration == 0) {
				onEnd.current?.()
			}
		}
	}, [transition, image])

	// next image not yet loaded
	if (!loaded) {
		return {
			img: prevImg.current,
			prev: undefined
		}
	}

	// next image loaded, need animation
	if (state.duration > 0) {
		return {
			img: currImg,
			prev: prevImg.current,
			duration: state.duration,
			effect: state.effect,
			onAnimationEnd: onEnd.current!
		}
	}

	// next image loaded, no animation
	return {
		img: currImg,
		prev: undefined
	}
}

export default useGraphicTransition