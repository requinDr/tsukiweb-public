import classNames from "classnames"
import { useState, useMemo, useEffect } from "react"
import { imageSrc } from "translation/assets"
import Lightbox, { SlideImage } from 'yet-another-react-lightbox'
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/styles.css"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import GalleryNbVariants from "./GalleryNbVariants"
import { MdLock } from "react-icons/md"
import { useMediaQuery } from "@uidotdev/usehooks"
import { replaceExtensionByAvif, supportAvif } from "@tsukiweb-common/utils/images"
import { GalleryImg } from "types"


interface CustomSlideImage extends SlideImage {
	source?: GalleryImg['source']
}


type GalleryImageProps = {
	image: GalleryImg
	thumb: string
	variants: GalleryImg[]
	unlockedVariants?: GalleryImg[]
	blurred?: boolean
	imagePath: (img: string) => string
}
const GalleryImage = ({image, thumb, variants = [], unlockedVariants = [], blurred = false, imagePath}: GalleryImageProps) => {
	const [open, setOpen] = useState(false)
	const isSmallLandscape = useMediaQuery("(orientation: landscape) and (max-height: 480px)")

	const slides: CustomSlideImage[] = useMemo(() => {
		return variants.map(image =>
			unlockedVariants.includes(image) ?
				({
					src: supportAvif ? replaceExtensionByAvif(imageSrc(imagePath(image.img), 'hd')) : imageSrc(imagePath(image.img), 'hd'),
					alt: image.img,
					source: image.source ? image.source : undefined,
				})
				: ({src: ""})
		)
	}, [unlockedVariants])

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (open && event.key === 'Escape') {
				event.stopPropagation()
				event.preventDefault()
				setOpen(false)
			}
		}

		if (open) {
			document.addEventListener('keydown', handleKeyDown, true)
		}

		return () => {
			document.removeEventListener('keydown', handleKeyDown, true)
		}
	}, [open])

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
			index={unlockedVariants.length > 0 ? slides.findIndex((slide) => slide.src !== "") : 0}
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
				slide: ({slide}) => {
					if (slide.src === "") {
						return (
							<div className="placeholder">
								<MdLock size={24} />
							</div>
						)
					}
				},
				slideHeader({slide}: {slide: CustomSlideImage}) {
					if (slide.source) {
						return (
							<div className="header">
								{slide.source}
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