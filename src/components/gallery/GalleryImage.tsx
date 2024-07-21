import classNames from "classnames"
import { useState, useMemo } from "react"
import { imageSrc } from "translation/assets"
import { GalleryImg, imagePath } from "utils/gallery"
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails"
import "yet-another-react-lightbox/styles.css";
import Lightbox, { SlideImage } from 'yet-another-react-lightbox'
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import GalleryNbVariants from "./GalleryNbVariants"

type GalleryImageProps = {
	image: GalleryImg
	thumb: string
	variants?: GalleryImg[]
	unlockedVariants?: GalleryImg[]
	blurred?: boolean
}
const GalleryImage = ({image, thumb, variants = [], unlockedVariants = [], blurred = false}: GalleryImageProps) => {
	const [open, setOpen] = useState(false)

	const slides: SlideImage[] = useMemo(() => {
		return variants.map(image =>
			unlockedVariants.includes(image) ?
			({src: imageSrc(imagePath(image.img), 'hd'), alt: image.img})
			: ({src: ""})
		)
	}, [unlockedVariants])

	return (
		<>
		<button onClick={() => setOpen(true)}>
			<img
				src={thumb}
				className={classNames("thumb", {"is-alternative": image.alternativeOf, blur: blurred})}
				alt={`event ${image.img}`}
				draggable={false}
				fetchpriority={blurred ? 'low' : 'auto'}
			/>
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
							<div className="placeholder" />
						)
					}
					return (
						<img
							src={slide.src}
							alt={slide.alt}
							draggable={false}
							fetchpriority="low"
							style={{objectFit: "contain", width: "100%", height: "100%"}}
						/>
					)
				}
			}}
			carousel={{
				finite: true,
				preload: 5,
			}}
			thumbnails={{
				width: 128,
				height: 96,
				padding: 0,
				borderColor: "#0098e1",
			}}
		/>
		</>
	)
}

export default GalleryImage