import { useReducer } from "react";
import { strings } from "../../translation/lang";
import { useObserver } from "@tsukiweb-common/utils/Observer";

/**
 * To use in components.
 * Forces a refresh of the component when the language is loaded.
 */
export function useLanguageRefresh() {
	const [_updateNum, forceUpdate] = useReducer(x => (x + 1) % 100, 0);
	useObserver(forceUpdate, strings, 'id')
}