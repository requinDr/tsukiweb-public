import { useReducer, useState } from "react";
import { strings } from "../../translation/lang";
import { observe, unobserve, useObserver } from "@tsukiweb-common/utils/Observer";

/**
 * To use in components.
 * Forces a refresh of the component when the language is loaded.
 */
export function useLanguageRefresh(once: boolean = false) {
	if (once) {
		const [_updated, setUpdated] = useState(false);
		if (!_updated) {
			const updater = ()=> {
				setUpdated(true);
				unobserve(strings, 'id', updater)
			}
			observe(strings, 'id', updater)
		}
	} else {
		const [_updateNum, forceUpdate] = useReducer(x => (x + 1) % 100, 0);
		useObserver(forceUpdate, strings, 'id')
	}
}