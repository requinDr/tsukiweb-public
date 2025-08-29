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
import { avif } from "@tsukiweb-common/utils/images"
import { GalleryImg } from "types"


interface CustomSlideImage extends SlideImage {
	source?: GalleryImg['source']
}

type GalleryImageProps = {
	image: string
	gallery: string[]
	galleryUnlocked?: string[]
	blurred?: boolean
	showTotal?: boolean
	getGalleryImg: (name: string) => GalleryImg
}
const GalleryImage = ({image, gallery = [], galleryUnlocked = [], blurred = false, showTotal, getGalleryImg}: GalleryImageProps) => {
	const [open, setOpen] = useState(false)
	const isSmallLandscape = useMediaQuery("(orientation: landscape) and (max-height: 480px)")

	const slides: CustomSlideImage[] = useMemo(() => {
		return gallery.map(img => {
			if (galleryUnlocked.includes(img)) {
				const src = imageSrc(img, 'hd')
				const galleryImg = getGalleryImg(img)
				return {
					src: avif.isSupported ? avif.replaceExtension(src) : src,
					alt: galleryImg.name,
					source: galleryImg.source ?? undefined,
				}
			} else {
				return { src: "" }
			}
		})
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

	const galleryImg = getGalleryImg(image)
	const src = imageSrc(image, 'thumb')

	return (
		<>
		<button onClick={() => setOpen(true)}>
			<picture>
				<source srcSet={avif.replaceExtension(src)} type="image/avif"/>
				<img
					src={src}
					className={classNames("thumb", {"is-alternative": galleryImg.altOf, blur: blurred})}
					alt={`event ${galleryImg.name}`}
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
				slides.findIndex(slide => slide.alt === galleryImg.name) !== -1 ?
					slides.findIndex(slide => slide.alt === galleryImg.name) :
						slides.findIndex(slide => slide.src !== "")
			}
			close={() => setOpen(false)}
			controller={{
				closeOnPullUp: true,
			}}
			plugins={[Zoom, Thumbnails]}
			render={{
				buttonZoom: () => null,
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