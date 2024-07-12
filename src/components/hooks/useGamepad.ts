import { useEffect, useRef } from "react"

type Props = {
	fct: () => void
}
const useGamepad = ({fct}: Props) => {
	const gameLoop = useRef<any>(null)

	function loop() {
		gameLoop.current = setInterval(fct, 100)
	}
	function stopLoop() {
		clearInterval(gameLoop.current)
	}

	useEffect(()=> {		
		window.addEventListener("gamepadconnected", loop)
		window.addEventListener("gamepaddisconnected", stopLoop)
		if (navigator.getGamepads().some(gamepad => gamepad)) {
			loop();
		}

		return ()=> {
			stopLoop()
			window.removeEventListener("gamepadconnected", loop)
			window.removeEventListener("gamepaddisconnected", stopLoop)
		}
	}, [])

	return () => {
		stopLoop()
	}
}

export default useGamepad