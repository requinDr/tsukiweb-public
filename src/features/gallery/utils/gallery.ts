import type { GalleryImg } from "app/utils/types"
import { GALLERY_IMAGES } from "./gallery-data"
import { settings } from "engine/settings"

function getImg(imgName: string): GalleryImg & { name: string } {
	return { ...GALLERY_IMAGES[imgName], name: imgName }
}

function isInGallery(image: string): boolean {
	return Object.hasOwn(GALLERY_IMAGES, image)
}

function shouldBlur(image: string): boolean {
	return (GALLERY_IMAGES[image]?.h ?? false) && settings.eroBlur
}

function getByGroup(group: GalleryImg["group"]): string[] {
	return Object.entries(GALLERY_IMAGES)
		.filter(([, img]) => img.group === group)
		.map(([key]) => key)
}

function getAlts(imgName: string): string[] {
	return Object.entries(GALLERY_IMAGES)
		.filter(([, img]) => img.altOf === imgName)
		.map(([key]) => key)
}

const isUnlocked = (img: string) =>
	settings.eventImages.includes(img)

const cg = {
	getImg,
	getByGroup,
	getAlts,
	shouldBlur,
	isUnlocked,
	isInGallery,
}
export default cg
