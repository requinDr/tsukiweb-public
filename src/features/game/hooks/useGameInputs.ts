import { useDOMEvent } from "@tsukiweb-common/hooks"
import { useEventActions } from "@tsukiweb-common/input/eventActions"
import { useSwipeGesture } from "@tsukiweb-common/input/touch"
import { RefObject, useCallback } from "react"
import { InGameLayersHandler } from "@tsukiweb-common/utils/InGameLayersHandler"
import actions, { ShowLayers, UserActionsHandler } from "features/game/utils/window-actions"

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

	useEventActions(createKeyMap, (action, e, ...args) =>
		actionsHandler.handleAction(action, e, ...args),
		document,
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