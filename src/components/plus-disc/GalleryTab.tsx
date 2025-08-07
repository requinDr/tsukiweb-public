import GalleryImage from "components/gallery/GalleryImage"
import { Fragment } from "react/jsx-runtime"
import { imageSrc } from "translation/assets"
import { GalleryImg } from "types"
import {cgPd} from "utils/gallery"
import { GALLERY_IMAGES_PD } from "utils/gallery-data"


const GalleryTab = () => {
	const images: GalleryImg[] = Object.values(GALLERY_IMAGES_PD)

	return (
		<div className="gallery-container">
			{images.map(img => {
				const thumbSrc = imageSrc(cgPd.getPath(img?.name), 'thumb')
				return (
					<Fragment key={img.name}>
						<GalleryImage
							image={img}
							src={thumbSrc}
							gallery={images}
							galleryUnlocked={images}
							blurred={cgPd.shouldBlur(img.name)}
							imagePath={cgPd.getPath}
						/>
					</Fragment>
				)
			}
			)}
		</div>
	)
}

export default GalleryTab