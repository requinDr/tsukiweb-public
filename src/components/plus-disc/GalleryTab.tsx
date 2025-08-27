import GalleryImage from "components/gallery/GalleryImage"
import { useMemo } from "react"
import {cgPd} from "utils/gallery"
import { GALLERY_IMAGES_PD } from "utils/gallery-data"
import { settings, viewedScene } from "utils/settings"


const GalleryTab = () => {
	const gallery: string[] = Object.keys(GALLERY_IMAGES_PD)

	const galleryUnlocked = useMemo(()=> {
		return settings.unlockEverything || viewedScene("pd_geccha2")
	}, [settings.unlockEverything, viewedScene])

	return (
		<div className="gallery-container">
			{galleryUnlocked
			? gallery.map(img => {
					return (
						<GalleryImage
							key={img}
							image={img}
							gallery={gallery}
							galleryUnlocked={gallery}
							blurred={cgPd.shouldBlur(img)}
							getGalleryImg={cgPd.getImg}
						/>
					)
				})
			: Array.from({length: gallery.length}).map((_, index) => (
				<div className="placeholder" key={index} />
			))}
		</div>
	)
}

export default GalleryTab