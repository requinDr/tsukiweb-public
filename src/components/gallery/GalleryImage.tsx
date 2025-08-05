import classNames from "classnames"
import { useState, useMemo, useEffect } from "react"
import { imageSrc } from "translation/assets"
import Lightbox, { SlideImage } from 'yet-another-react-lightbox'
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/styles.css"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import GalleryTotal from "./GalleryTotal"
import { MdLock } from "react-icons/md"
import { useMediaQuery } from "@uidotdev/usehooks"
import { replaceExtensionByAvif, supportAvif } from "@tsukiweb-common/utils/images"
import { GalleryImg } from "types"


interface CustomSlideImage extends SlideImage {
	source?: GalleryImg['source']
}


type GalleryImageProps = {
	image: GalleryImg
	src: string
	gallery: GalleryImg[]
	galleryUnlocked?: GalleryImg[]
	blurred?: boolean
	showTotal?: boolean
	imagePath: (img: string) => string
}
const GalleryImage = ({image, src, gallery = [], galleryUnlocked = [], blurred = false, showTotal, imagePath}: GalleryImageProps) => {
	const [open, setOpen] = useState(false)
	const isSmallLandscape = useMediaQuery("(orientation: landscape) and (max-height: 480px)")

	const slides: CustomSlideImage[] = useMemo(() => {
		return gallery.map(img =>
			galleryUnlocked.includes(img) ?
				({
					src: supportAvif ? replaceExtensionByAvif(imageSrc(imagePath(img.name), 'hd')) : imageSrc(imagePath(img.name), 'hd'),
					alt: img.name,
					source: img.source ? img.source : undefined,
				})
				: ({src: ""})
		)
	}, [galleryUnlocked])

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
				<source srcSet={replaceExtensionByAvif(src)} type="image/avif"/>
				<img
					src={src}
					className={classNames("thumb", {"is-alternative": image.altOf, blur: blurred})}
					alt={`event ${image.name}`}
					draggable={false}
					fetchPriority={blurred ? 'low' : 'auto'}
				/>
			</picture>
			{showTotal && gallery.length > 1 &&
				<GalleryTotal
					nbTotal={gallery.length}
					nbUnlocked={galleryUnlocked.length}
				/>
			}
		</button>
		
		<Lightbox
			slides={slides}
			open={open}
			index={
				slides.findIndex(slide => slide.alt === image.name) !== -1 ?
					slides.findIndex(slide => slide.alt === image.name) :
						slides.findIndex(slide => slide.src !== "")
			}
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