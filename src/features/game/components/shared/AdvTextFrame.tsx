import { memo, useLayoutEffect, useMemo, useRef, useState } from "react"

function getFramePath(width: number, height: number) {
	const strokeInset = 1.5
	const radius = Math.min(24, width / 4, height / 2)
	const left = strokeInset
	const top = strokeInset
	const right = width - strokeInset
	const bottom = height - strokeInset

	return [
		`M ${left + radius} ${top}`,
		`H ${right - radius}`,
		`A ${radius} ${radius} 0 0 0 ${right} ${top + radius}`,
		`V ${bottom - radius}`,
		`A ${radius} ${radius} 0 0 0 ${right - radius} ${bottom}`,
		`H ${left + radius}`,
		`A ${radius} ${radius} 0 0 0 ${left} ${bottom - radius}`,
		`V ${top + radius}`,
		`A ${radius} ${radius} 0 0 0 ${left + radius} ${top}`,
		"Z",
	].join(" ")
}

const AdvTextFrame = () => {
	const frameRef = useRef<SVGSVGElement>(null)
	const [size, setSize] = useState({ width: 0, height: 0 })

	useLayoutEffect(() => {
		const layer = frameRef.current?.parentElement
		if (!layer)
			return

		const updateSize = () => {
			setSize({
				width: Math.round(layer.clientWidth),
				height: Math.round(layer.clientHeight),
			})
		}

		const resizeObserver = new ResizeObserver(updateSize)
		updateSize()
		resizeObserver.observe(layer)
		return () => resizeObserver.disconnect()
	}, [])

	const path = useMemo(
		() => size.width > 0 && size.height > 0 ? getFramePath(size.width, size.height) : null,
		[size],
	)

	return (
		<svg
			ref={frameRef}
			className="adv-frame"
			width={size.width}
			height={size.height}
			aria-hidden="true"
			focusable="false">
			{path &&
				<>
					<defs>
						<linearGradient id="textbox-adv" x1="0" y1="1" x2="0" y2="0">
							<stop offset="0" stopColor="rgb(1, 109, 188)" stopOpacity="0.7" />
							<stop offset="1" stopColor="#00315a" />
						</linearGradient>
					</defs>
					<path
						d={path}
						fill="url(#textbox-adv)"
						stroke="rgba(246, 246, 246, 0.69)"
						strokeWidth="3" />
				</>
			}
		</svg>
	)
}

export default memo(AdvTextFrame)
