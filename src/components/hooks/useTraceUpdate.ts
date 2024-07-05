import { useRef, useEffect } from "react";

/**
 * Prints the changes in the provided properties everytime the component updates.
 * The logs are outputed using the function `console.debug()`.
 * @param prefix prefix to print before the changes in the output
 * @param props Properties to watch
 */
export function useTraceUpdate(prefix: string, props: Record<string, any>) {
	const prev = useRef(props);
	useEffect(() => {
		const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
			if (prev.current[k] !== v) {
				ps[k] = [prev.current[k], v];
			}
			return ps;
		}, {} as Record<string, any>);
		if (Object.keys(changedProps).length > 0) {
				console.debug(prefix, 'Changed props:', changedProps);
			} else {
			console.debug(prefix, 'No changed props');
		}
		prev.current = props;
	});
}
