import { useDOMEvent } from "@tsukiweb-common/hooks"
import { useKeyMap } from "@tsukiweb-common/input/KeyMap"
import { useSwipeGesture } from "@tsukiweb-common/input/touch"
import { RefObject, useCallback } from "react"
import { InGameLayersHandler } from "utils/display"
import actions, { ShowLayers, UserActionsHandler } from "utils/window-actions"

type UseGameInputs = {
	rootRef: RefObject<null>
	layers: InGameLayersHandler
	actionsHandler: UserActionsHandler
	show: ShowLayers
}
export const useGameInputs = ({ rootRef, layers, actionsHandler, show }: UseGameInputs) => {
	const createKeyMap = useCallback(() =>
		actions.createKeyMap(layers, show)
	, [layers, show])

	useKeyMap(createKeyMap, (action, e, ...args) =>
		actionsHandler.handleAction(action, e, ...args),
		document,
		"keydown",
		{ capture: false }
	)

	useSwipeGesture(actions.swipeCallback.bind(null, layers), rootRef, 50)

	useDOMEvent((e: WheelEvent)=> {
		if (e.ctrlKey)
			return
		const topLayer = layers.topLayer
		if (e.deltaY < 0 && ['text', 'graphics'].includes(topLayer)) {
			layers.history = true
		} else if (e.deltaY > 0 && topLayer === 'text') {
			actionsHandler.next()
		}
	}, window, 'wheel')
}