import GalleryImage from "components/gallery/GalleryImage"
import { Fragment } from "react/jsx-runtime"
import { imageSrc } from "translation/assets"
import { GALLERY_IMAGES_PD, GalleryImg, imagePathPd } from "utils/gallery"
import { settings } from "utils/settings"

const GalleryTab = () => {
	const images: GalleryImg[] = Object.values(GALLERY_IMAGES_PD)
	return (
		<div className="gallery-container">
			{images.map((image) => {
				const thumbSrc = imageSrc(imagePathPd(image?.img), 'thumb')
				return (
					<Fragment key={image.img}>
						<GalleryImage
							image={image}
							thumb={thumbSrc}
							variants={[image]}
							unlockedVariants={[image]}
							blurred={image.sensitive && settings.blurThumbnails}
							imagePath={imagePathPd}
						/>
					</Fragment>
				)
			}
			)}
		</div>
	)
}

export default GalleryTab