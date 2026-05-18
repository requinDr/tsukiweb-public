import { directionalNavigate } from "@tsukiweb-common/input/arrowNavigation"
import { useEventActions } from "@tsukiweb-common/input/eventActions"
import { menuKeyMap } from "features/game/utils/keybind"

function keyboardCallback(action: string, evt: KeyboardEvent, ...args: any) {
	switch (action) {
		case "nav" : return directionalNavigate(args[0])
		default : throw Error(`Unknown action ${action}`)
	}
}

export const useKeyArrows = () =>
	useEventActions(menuKeyMap, keyboardCallback, document, {capture: false})