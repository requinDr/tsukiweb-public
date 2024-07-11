import { useEffect, useState } from "react"

type Props = {
	hideDelay?: number
}

// hide mouse cursor when it has not moved for 5s
const useMousePointer = ({hideDelay = 5000}: Props = {})=> {
	const [mouseCursorVisible, setMouseCursorVisible] = useState<boolean>(true)

	useEffect(()=> {
		let timeout: NodeJS.Timeout
		const hideCursor = ()=> {
			setMouseCursorVisible(false)
		}
		const showCursor = ()=> {
			setMouseCursorVisible(true)
			clearTimeout(timeout)
			timeout = setTimeout(hideCursor, hideDelay)
		}
		showCursor()
		window.addEventListener('mousemove', showCursor)
		return ()=> {
			clearTimeout(timeout)
			window.removeEventListener('mousemove', showCursor)
		}
	}, [])

	return mouseCursorVisible
}

export default useMousePointer