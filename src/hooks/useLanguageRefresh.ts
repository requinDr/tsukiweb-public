import { useCallback, useSyncExternalStore } from "react"
import { observe, unobserve } from "@tsukiweb-common/utils/Observer"
import { strings } from "translation/lang"
import { langSelection } from "translation/langSelection"

/**
 * To use in components.
 * Forces a refresh of the component when the language is loaded.
 */
export function useLanguageRefresh() {
	const subscribe = useCallback((onStoreChange: VoidFunction) => {
		observe(strings, 'id', onStoreChange)
		observe(langSelection, 'ready', onStoreChange)
		
		return () => {
			unobserve(strings, 'id', onStoreChange)
			unobserve(langSelection, 'ready', onStoreChange)
		}
	}, [])
	
	return useSyncExternalStore(subscribe, () => langSelection.ready ? strings.id : null)
}