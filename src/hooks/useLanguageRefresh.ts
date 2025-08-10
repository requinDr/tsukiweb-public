import { useReducer } from "react"
import { useObserver } from "@tsukiweb-common/utils/Observer"
import { strings } from "translation/lang"

/**
 * To use in components.
 * Forces a refresh of the component when the language is loaded.
 */
export function useLanguageRefresh(once: boolean = false) {
	const [, forceUpdate] = useReducer(x => x + 1, 0)

	useObserver(forceUpdate, strings, 'id', { once })
}