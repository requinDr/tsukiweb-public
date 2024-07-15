import { DivProps } from "../../types";
import { bb } from "../../utils/Bbcode";
import { findImageObjectByName } from "../../utils/gallery";
import { imageSrc } from "../../translation/assets";
import { splitFirst } from "../../../tsukiweb-common/src/utils/utils";
import { settings } from "../../utils/settings";
import { SpritePos } from "@tsukiweb-common/types";

type Props = {
	pos: SpritePos
	image: string
	resolution?: typeof settings.resolution
	lazy?: boolean
	props?: DivProps
}

const GraphicElement = ({ pos, image, resolution = settings.resolution, lazy = false, props = {} }: Props) => {

	image = image || (pos == "bg" ? "#000000" : "#00000000")
	const isColor = image.startsWith("#")
	let text
	[image, text] = splitFirst(image, "$")

	let imageElement = undefined
	let overlay = undefined

	if (isColor) {
		const { style, ...attrs } = props
		props = {
			style: { background: image, ...(style ?? {}) },
			...attrs,
		};
	} else {
		const imgUrl = imageSrc(image, resolution)
		const alt = `[[sprite:${image}]]`
		const blur = findImageObjectByName(image)?.sensitive && settings.blurThumbnails
		imageElement = (
			<img
				src={imgUrl}
				alt={alt}
				draggable={false}
				className={blur ? "blur" : ""}
				{...(lazy ? { loading: "lazy" } : {})}
			/>
		)
	}
	if (text) {
		const match = text.match(/^(?<vAlign>[tcb])?`(?<str>[^`]*)`/)
		const { vAlign, hAlign, str } = match?.groups ?? {}
		overlay = (
			<div
				className="text"
				{...{
					"vertical-align": vAlign ?? "c",
				}}
			>
				{bb(str ?? "[color=red][u]/!\\ Ill-formed text")}
			</div>
		)
	}

	const className: string[] = [pos]
	const { className: insertClass, ...attrs } = props
	if (insertClass) className.push(insertClass)

	return (
		<div className={className.join(" ")} {...attrs}>
			{imageElement}
			{overlay}
		</div>
	)
}

export default GraphicElement