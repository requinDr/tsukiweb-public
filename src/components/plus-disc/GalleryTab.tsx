import GalleryImage from "components/gallery/GalleryImage"
import { useMemo } from "react"
import cg from "utils/gallery"
import { settings, viewedScene } from "utils/settings"


const GalleryTab = () => {
	const gallery: string[] = cg.getByGroup("pd")

	const galleryUnlocked = useMemo(()=>
		settings.unlockEverything || viewedScene("pd_geccha2")
	, [settings.unlockEverything])

	return (
		<div className="gallery-container">
			{galleryUnlocked
			? gallery.map(img => 
					<GalleryImage
						key={img}
						image={img}
						gallery={gallery}
						galleryUnlocked={gallery}
						blurred={cg.shouldBlur(img)}
						getGalleryImg={cg.getImg}
						nav-auto={1}
					/>
				)
			: Array.from({length: gallery.length}).map((_, index) =>
				<div key={index} className="placeholder" tabIndex={0} nav-auto={1} />
			)}
		</div>
	)
}

export default GalleryTab