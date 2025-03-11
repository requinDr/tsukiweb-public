import classNames from "classnames"
import { useState, useMemo } from "react"
import { imageSrc } from "translation/assets"
import { GalleryImg, imagePath } from "utils/gallery"
import Lightbox, { SlideImage } from 'yet-another-react-lightbox'
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import GalleryNbVariants from "./GalleryNbVariants"
import { MdLock } from "react-icons/md"
import { useMediaQuery } from "@uidotdev/usehooks"
import { replaceExtensionByAvif, supportAvif } from "@tsukiweb-common/utils/images"

type GalleryImageProps = {
	image: GalleryImg
	thumb: string
	variants?: GalleryImg[]
	unlockedVariants?: GalleryImg[]
	blurred?: boolean
}
const GalleryImage = ({image, thumb, variants = [], unlockedVariants = [], blurred = false}: GalleryImageProps) => {
	const [open, setOpen] = useState(false)
	const isSmallLandscape = useMediaQuery("(orientation: landscape) and (max-height: 480px)")

	const slides: SlideImage[] = useMemo(() => {
		return variants.map(image =>
			unlockedVariants.includes(image) ?
			({
				src: supportAvif ? replaceExtensionByAvif(imageSrc(imagePath(image.img), 'hd')) : imageSrc(imagePath(image.img), 'hd'),
				alt: image.img
			})
			: ({src: ""})
		)
	}, [unlockedVariants])

	return (
		<>
		<button onClick={() => setOpen(true)}>
			<picture>
				<source srcSet={replaceExtensionByAvif(thumb)} type="image/avif"/>
				<img
					src={thumb}
					className={classNames("thumb", {"is-alternative": image.alternativeOf, blur: blurred})}
					alt={`event ${image.img}`}
					draggable={false}
					fetchPriority={blurred ? 'low' : 'auto'}
				/>
			</picture>
			{variants.length > 1 &&
				<GalleryNbVariants
					nbVariants={variants.length}
					nbUnlocked={unlockedVariants.length}
				/>
			}
		</button>
		
		<Lightbox
			slides={slides}
			open={open}
			close={() => setOpen(false)}
			controller={{
				closeOnPullUp: true,
			}}
			plugins={[Zoom, Thumbnails]}
			render={{
				buttonZoom: () => <></>,
				thumbnail: ({slide}) => {
					if (slide.src === "") {
						return (
							<div className="placeholder">
								<MdLock size={24} />
							</div>
						)
					}
				},
				iconError: () => <MdLock size={24} />,
			}}
			carousel={{
				finite: true,
				preload: 5,
			}}
			zoom={{
				maxZoomPixelRatio: 2,
			}}
			thumbnails={{
				width: 128,
				height: 96,
				padding: 0,
				borderColor: "#0098e1",
				position: isSmallLandscape ? "start" : "bottom",
			}}
		/>
		</>
	)
}

export default GalleryImage