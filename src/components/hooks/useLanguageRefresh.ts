import { useReducer } from "react";
import { useObserver } from "../../utils/Observer";
import { strings } from "../../translation/lang";

/**
 * To use in components.
 * Forces a refresh of the component when the language is loaded.
 */
export function useLanguageRefresh() {
  const [_updateNum, forceUpdate] = useReducer(x => (x + 1) % 100, 0);
  useObserver(forceUpdate, strings, 'id')
}