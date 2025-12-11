import classNames from "classnames"
import { useState, useMemo, useEffect } from "react"
import Lightbox, { SlideImage } from 'yet-another-react-lightbox'
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/styles.css"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import { MdClose, MdLock } from "react-icons/md"
import useMediaQuery from "@tsukiweb-common/hooks/useMediaQuery"
import { GalleryPlaceholderLocked, GalleryTotal } from "./GalleryComponents"
import { imageSrc } from "translation/assets"
import { GalleryImg } from "types"

declare module "yet-another-react-lightbox" {
	interface SlideImage {
		source?: GalleryImg['source']
	}
}

type GalleryImageProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	image: string
	gallery: string[]
	galleryUnlocked?: string[]
	blurred?: boolean
	showTotal?: boolean
	getGalleryImg: (name: string) => GalleryImg
}
const GalleryImage = ({image, gallery = [], galleryUnlocked = [], blurred = false, showTotal, getGalleryImg, ...props}: GalleryImageProps) => {
	const [open, setOpen] = useState(false)
	const isSmallLandscape = useMediaQuery("(orientation: landscape) and (max-height: 480px)")

	const slides: SlideImage[] = useMemo(() =>
		gallery.map(img => {
			if (!galleryUnlocked.includes(img))
				return { src: "" }

			const g = getGalleryImg(img)
			return {
				src: imageSrc(img, 'src'),
				alt: g.name,
				source: g.source,
			}
		}
	), [gallery, galleryUnlocked])

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
	const index = slides.findIndex(slide => slide.alt === galleryImg.name) !== -1
		? slides.findIndex(slide => slide.alt === galleryImg.name)
		: slides.findIndex(slide => slide.src !== "")

	return (
		<>
		<button {...props} onClick={() => setOpen(true)}>
			<img
				src={imageSrc(image, 'thumb')}
				className={classNames("thumb", {"is-alternative": galleryImg.altOf, blur: blurred})}
				alt={`event ${galleryImg.name}`}
				draggable={false}
				fetchPriority={blurred ? 'low' : 'auto'}
			/>
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
			index={index}
			close={() => setOpen(false)}
			controller={{ closeOnPullUp: true }}
			plugins={[Zoom, Thumbnails]}
			render={{
				buttonZoom: () => null,
				thumbnail: ({ slide }) => (slide.src ? null : <GalleryPlaceholderLocked />),
				slide: ({ slide }) => (slide.src ? null : <GalleryPlaceholderLocked />),
				slideHeader: ({slide}) => (slide.source && <div className="header">{slide.source}</div>),
				iconError: () => <MdLock size={24} />,
				iconClose: () => <MdClose size={24} />,
			}}
			carousel={{ finite: true, preload: 5 }}
			zoom={{ maxZoomPixelRatio: 2 }}
			thumbnails={{ position: isSmallLandscape ? "start" : "bottom" }}
		/>
		</>
	)
}

export default GalleryImage