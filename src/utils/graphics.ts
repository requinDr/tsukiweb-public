import { displayMode } from "./display";

const POSITIONS = ["top", "center", "bottom"]

/**
 * Move background up or down
 */
export function moveBg(direction: "up"|"down") {
	let index = POSITIONS.indexOf(displayMode.bgAlignment)
	if (direction == "down" && index < 2) index++
	else if(direction == "up" && index > 0) index--
	displayMode.bgAlignment = POSITIONS[index]
}