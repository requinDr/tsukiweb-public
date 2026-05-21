import classNames from "classnames"
import { useState, useMemo, useRef } from "react"
import Lightbox, { ControllerRef, SlideImage } from 'yet-another-react-lightbox'
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/styles.css"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/plugins/thumbnails.css"
import { MdClose, MdLock } from "react-icons/md"
import { GalleryPlaceholderLocked, GalleryTotal } from "./GalleryComponents"
import { imageSrc } from "translation/assets"
import { GalleryImg } from "app/utils/types"
import { Button } from "@tsukiweb-common/ui-core"
import { useMediaQuery, useNavBackRef } from "@tsukiweb-common/hooks"

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
	getGalleryImg: (name: string) => GalleryImg & { name: string }
}
const GalleryImage = ({image, gallery = [], galleryUnlocked = [], blurred = false, showTotal, getGalleryImg, ...props}: GalleryImageProps) => {
	const [open, setOpen] = useState(false)
	const isSmallLandscape = useMediaQuery("(orientation: landscape) and (max-height: 480px)")
	const lightboxRef = useRef<ControllerRef>(null)

	const slides: SlideImage[] = useMemo(() =>
		gallery.map(img => {
			if (!galleryUnlocked.includes(img)) return { src: "" }

			const { name: alt, source } = getGalleryImg(img)
			return { src: imageSrc(img, 'src'), alt, source }
		}
	), [gallery, galleryUnlocked])

	const galleryImg = getGalleryImg(image)
	const index = slides.findIndex(slide => slide.alt === galleryImg.name) !== -1
		? slides.findIndex(slide => slide.alt === galleryImg.name)
		: slides.findIndex(slide => slide.src !== "")
	
	const closeLightboxRef = useNavBackRef(()=>setOpen(false))
	// attach a ref to the back button to get back to the root of the lightbox
	const handleLightboxRef = (node: HTMLElement|null)=> {
		while (node && !node.classList.contains("yarl__root"))
			node = node.parentElement
		closeLightboxRef(node)
	}

	return (
		<>
		<button {...props} onClick={() => setOpen(true)}>
			<img
				src={imageSrc(image, 'thumb')}
				className={classNames("thumb", {"is-alternative": galleryImg.altOf, blur: blurred})}
				alt={`Game CG ${galleryImg.name}`}
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
			controller={{ closeOnPullUp: true, ref: lightboxRef }}
			plugins={[Zoom, Thumbnails]}
			render={{
				buttonZoom: () => null,
				thumbnail: ({ slide }) => (slide.src ? null : <GalleryPlaceholderLocked />),
				slide: ({ slide }) => (slide.src ? null : <GalleryPlaceholderLocked />),
				slideHeader: ({slide}) => (slide.source && <div className="header">{slide.source}</div>),
				iconError: () => <MdLock size={24} />,
				buttonClose: () =>
					<Button onClick={() => lightboxRef.current?.close()} key="close" ref={handleLightboxRef}>
						<MdClose size={24} />
					</Button>,
			}}
			carousel={{ finite: true, preload: 5 }}
			zoom={{ maxZoomPixelRatio: 2 }}
			thumbnails={{ position: isSmallLandscape ? "start" : "bottom" }}
		/>
		</>
	)
}

export default GalleryImage