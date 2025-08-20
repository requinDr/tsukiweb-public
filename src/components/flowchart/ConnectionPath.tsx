import { PartialRecord } from "@tsukiweb-common/types";
import { memo } from "react";
import { DY, FcNode, OVERLAP_BREAK_LENGTH } from "utils/flowchart";

type ConnectionPathProps = {
	from: FcNode;
	to: FcNode;
}

const ConnectionPath = memo(({ from, to }: ConnectionPathProps) => {
	const {centerX: x1, bottom: y1} = from
	const {centerX: x2, top: y2} = to

	let path = `M ${x1},${y1}`
	if      (x1 == x2) path += ` V ${y2}`
	else if (y1 == y2) path += ` H ${x2}`
	else {
		const turnY = y2 - DY
		if (turnY > y1)
			path += ` V ${turnY}`
		path +=` H ${x2} V ${y2}`
	}

	const id = `${from.id}-${to.id}`
	const attrs: PartialRecord<'style', any> = { }
	
	if (to.cutAt != 0) {
		const totalLength = (y2 - y1) + Math.abs(x2 - x1)
		const bl = OVERLAP_BREAK_LENGTH
		const cutLength = to.cutAt * DY
		const dashes = [totalLength - cutLength - bl/2, bl, cutLength - bl/2]
		attrs.style = {strokeDasharray: dashes.join(' ')}
	}
	return <path key={id} id={id} className="fc-link" d={path} {...attrs} />
})

export default ConnectionPath