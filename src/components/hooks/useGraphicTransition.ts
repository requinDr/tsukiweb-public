import { useState, useRef, useCallback } from "react";
import { useObserver } from "../../../tsukiweb-common/src/utils/Observer";
import { splitFirst } from "../../../tsukiweb-common/src/utils/utils";
import { gameContext } from "../../utils/variables";
import { preloadImage } from "../molecules/GraphicsGroup";
import { transition } from "../../utils/graphics";
import { SpritePos } from "@tsukiweb-common/types";

type GraphicTransitionResult = {
	img: string;
	prev: string;
	duration: number;
	effect: string;
	imgLoaded: boolean;
};

function useGraphicTransition(
	pos: SpritePos,
	preload: boolean = true
): GraphicTransitionResult {
	const [img, setImg] = useState(gameContext.graphics[pos]);
	const [loaded, setLoaded] = useState(true);
	const prev = useRef(gameContext.graphics[pos]);
	const [d, setD] = useState(0);
	const [e, setE] = useState("");

	const onChange = useCallback(() => {
		const { duration: transD, pos: transPos, effect: transE } = transition;
		if (transD == 0 || (transPos != pos && (pos == "bg" || transPos != "a"))) {
			setD(0);
			setE("");
			prev.current = gameContext.graphics[pos];
		} else {
			setD(transD);
			setE(transE);
		}
	}, []);
	useObserver(onChange, transition, "duration");
	useObserver(onChange, transition, "effect");

	useObserver(
		(img) => {
			setImg(img);
			if (preload && img) {
				setLoaded(false);
				img = splitFirst(img, "$")[0];
				preloadImage(img).finally(setLoaded.bind(null, true));
			} else {
				setLoaded(true);
			}
			onChange();
		},
		gameContext.graphics,
		pos
	);

	return { img, prev: prev.current, duration: d, effect: e, imgLoaded: loaded };
}

export default useGraphicTransition