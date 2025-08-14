import GraphicsGroup from "components/molecules/GraphicsGroup"
import { useEffect, useRef } from "react"
import { FcNode } from "utils/flowchart"

type PopoverProps = {
	node: FcNode,
	onClose: () => void
}
const ScenePopover = ({ node, onClose }: PopoverProps) => {
	const popoverRef = useRef<HTMLDivElement>(null)
	
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
				onClose()
			}
		}
		
		document.addEventListener('mousedown', handleClickOutside)
		
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [onClose])

	return (
		<div className="scene-popover-content" ref={popoverRef}>
			<div className="header">
				<GraphicsGroup images={node.graph ?? {bg:"#000"}} resolution="sd" />
			</div>
			<div className="content">
				{node.id}<br/>
			</div>
		</div>
	)
}

export default ScenePopover