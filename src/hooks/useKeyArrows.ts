import directionalNavigate from "@tsukiweb-common/input/arrowNavigation"
import { useKeyMap } from "@tsukiweb-common/input/KeyMap"
import { menuKeyMap } from "utils/keybind"

function keyboardCallback(action: any, evt: KeyboardEvent, ...args: any) {
	switch (action) {
		case "nav" : return directionalNavigate(args[0])
		default : throw Error(`Unknown action ${action}`)
	}
}

export const useKeyArrows = () => 
	useKeyMap(menuKeyMap, keyboardCallback, document, 'keydown', { capture: false })