import { COLUMN_WIDTH, DY, OVERLAP_BREAK_LENGTH } from "utils/flowchart";

export class FcNode {
	column: number;
	y: number;
	id: string;
	from: FcNode[];
	cutAt?: number
	constructor(id: string, column: number, from: FcNode[], alignedNode?: FcNode, cutAt?: number) {
		this.id = id
		this.column = column
		this.from = from
		this.y = alignedNode ? alignedNode.top
					 : from.reduce((yMax, node)=> Math.max(node.bottom, yMax), 0) + DY*2
		this.cutAt = cutAt
	}

	get x()       { return this.column * COLUMN_WIDTH }
	get width()   { return 0 }
	get height()  { return 0 }
	get top()     { return this.y - this.height/2 }
	get bottom()  { return this.y + this.height/2 }
	get left()    { return this.x - this.width/2 }
	get right()   { return this.x + this.width/2 }

	render(disabled: boolean): React.ReactNode {
		return this.from.map(node=> {
			const id = `${node.id}-${this.id}`
			const yStart = node.bottom
			const yEnd = this.top
			let path = `M ${node.x},${yStart}`
			if (node.column == this.column)
				path += ` V ${yEnd}`
			else if (yStart == yEnd)
				path += ` H ${this.x}`
			else {
				const turnY = yEnd - DY
				if (turnY > yStart)
					path += ` V ${turnY}`
				path +=` H ${this.x} V ${yEnd}`
			}
			if (this.cutAt != undefined) {
				const totalLength = (yEnd - yStart) + Math.abs(this.x - node.x)
				const bl = OVERLAP_BREAK_LENGTH
				const cutLength = this.cutAt * DY
				const lengths = [totalLength - cutLength - bl/2, bl, cutLength - bl/2]
				return (
					<path key={id}
						className="fc-link"
						id={id}
						d={path}
						style={{strokeDasharray: lengths.join(' ')}}
					/>
				)
			} else {
				return (
					<path key={id}
						className="fc-link"
						id={id}
						d={path}
					/>
				)
			}
		})
	}
}