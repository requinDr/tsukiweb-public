import { useState, useRef, useEffect } from "react";
import { GraphicsTransition, SpritePos } from "@tsukiweb-common/types";
import { splitFirst } from "@tsukiweb-common/utils/utils";
import { preloadImage } from "components/molecules/GraphicsGroup";

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
};


function useGraphicTransition(pos: SpritePos, image: string,
		transition?: GraphicsTransition, preload: boolean = true
		): GraphicTransitionResult {
	const [currImg, setCurrImg] = useState<string>(image)
	const prevImg = useRef<string>(image)
	const onEnd = useRef<VoidFunction>(undefined)
	const [loaded, setLoaded] = useState(true)
	const [currentDuration, setDuration] = useState(0)
	const [currentEffect, setEffect] = useState("")

	useEffect(()=> {
		const {duration = 0, effect, onFinish,
			to: {[pos]: transImg = undefined} = {}} = transition ?? {}
		let load = false
		if (transImg != undefined && transImg != currImg) {
			//console.debug(`${pos}: ${currImg} --> ${transImg} (${effect}, ${duration})`)
			setDuration(duration)
			setEffect(effect!)
			prevImg.current = currImg
			setCurrImg(transImg)
			load = true
			onEnd.current = ()=> {
				onEnd.current = undefined
				setDuration(0)
				setEffect("")
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
			if (currentDuration > 0 || currentEffect.length > 0) { //transition on other position
				setDuration(0)
				setEffect("")
			}
		}
		if (load) {
			const loadImage = transImg ?? image
			const src = splitFirst(loadImage, '$')[0]
			if (src.length > 0) {
				setLoaded(false)
				preloadImage(src).finally(()=> {
					//if (currImg.current == loadImage) {
						setLoaded(true)
						if (onEnd.current && duration == 0)
							onEnd.current() // instant transition -> onEnd when loaded
					//}
				})
			} else if (duration == 0) {
				onEnd.current?.()
			}
		}
	}, [transition, image])
	return (
		!loaded ? { // next image not yet loaded
			img: prevImg.current,
			prev: undefined
		} : currentDuration > 0 ? { // next image loaded, need animation
			img: currImg,
			prev: prevImg.current,
			duration: currentDuration,
			effect: currentEffect,
			onAnimationEnd: onEnd.current as VoidFunction
		} : { // next image loaded, no animation
			img: currImg,
			prev: undefined
		}
	);
}

export default useGraphicTransition