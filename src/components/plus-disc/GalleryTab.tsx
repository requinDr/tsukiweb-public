import GalleryImage from "components/gallery/GalleryImage"
import { useMemo } from "react"
import { Fragment } from "react/jsx-runtime"
import { imageSrc } from "translation/assets"
import { GalleryImg } from "types"
import {cgPd} from "utils/gallery"
import { GALLERY_IMAGES_PD } from "utils/gallery-data"
import { settings, viewedScene } from "utils/settings"


const GalleryTab = () => {
	const images: GalleryImg[] = Object.values(GALLERY_IMAGES_PD)

	const galleryUnlocked = useMemo(()=> {
		return settings.unlockEverything || viewedScene("pd_geccha2")
	}, [settings.unlockEverything, viewedScene])

	return (
		<div className="gallery-container">
			{galleryUnlocked
			? images.map(img => {
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
				})
			: Array.from({length: images.length}).map((_, index) => (
				<div className="placeholder" key={index} />
			))}
		</div>
	)
}

export default GalleryTab