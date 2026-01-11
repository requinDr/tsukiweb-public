import GraphicsGroup from "@tsukiweb-common/graphics/GraphicsGroup"
import AnimatedHideActivityDiv from "@tsukiweb-common/ui-core/components/AnimatedHideActivityDiv"
import { Bbcode } from "@tsukiweb-common/utils/Bbcode"
import Timer from "@tsukiweb-common/utils/timer"
import { SVGProps, useCallback, useEffect, useRef, useState } from "react"
import { FcNode } from "utils/flowchart"

type PopoverProps = {
	node: FcNode|undefined,
}

const ScenePopover = ({ node }: PopoverProps) => {

	return (
		<div className="scene-popover-content">
			<div className="header">
				<GraphicsGroup images={node!.graph ?? {bg:"#000"}} />
			</div>
			<div className="title">
				<Bbcode text={node!.displayName}/><br/>
			</div>
			<div className="id">
				<Bbcode text={node!.id}/><br/>
			</div>
		</div>
	)
}

export function useStateEvent(exitEvt: string, captureExit = false) {
	const [status, setStatus] = useState<boolean>(false)
	const onEnter = useCallback((evt: Event)=> {
		setStatus(true)
		evt.currentTarget?.addEventListener(exitEvt,
				setStatus.bind(undefined, false),
				{capture: captureExit, once: true, passive: true})
	}, [])
	return [status, onEnter, setStatus] as const
}

export function useFcPopup(
	node: FcNode,
	setPopup: (node: FcNode, enable: boolean)=> void,
	props: SVGProps<SVGGElement> = {}
) {
	const [hover, onMouseEnter] = useStateEvent('mouseexit')
	const [focus, onFocus] = useStateEvent('blur')

	useEffect(()=> {
		setPopup(node, hover||focus)
	}, [hover || focus])

	return {
		onFocus,
		onMouseEnter
	}
}

export default ScenePopover