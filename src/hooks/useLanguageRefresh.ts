import { useCallback, useSyncExternalStore } from "react"
import { observe, unobserve } from "@tsukiweb-common/utils/Observer"
import { strings } from "translation/lang"

/**
 * To use in components.
 * Forces a refresh of the component when the language is loaded.
 */
export function useLanguageRefresh() {
	const subscribe = useCallback((onStoreChange: VoidFunction) => {
		observe(strings, 'id', onStoreChange)
		
		return () => {
			unobserve(strings, 'id', onStoreChange)
		}
	}, [])
	
	return useSyncExternalStore(subscribe, () => strings.id)
}