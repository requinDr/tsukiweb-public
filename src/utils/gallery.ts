import { CharId, GalleryImg } from "types"
import { settings } from "./settings"
import { GALLERY_IMAGES, GALLERY_IMAGES_PD } from "./gallery-data"


function shouldBlur(image: string): boolean {
	return (GALLERY_IMAGES[image]?.sensitive ?? false) && settings.blurThumbnails
}

function getByRoute(route: CharId): GalleryImg[] {
	return Object.values(GALLERY_IMAGES).filter((img) => img.route === route)
}

function getVariants(imgName: string): GalleryImg[] {
	return Object.values(GALLERY_IMAGES).filter((img) => img.alternativeOf === imgName || img.img === imgName)
}

function getPath(imgName: string): string {
	const img = GALLERY_IMAGES[imgName]
	if (!img) return ""

	return `${img.path}/${img.img}`
}

function getNameFromPath(path: string): string {
	if (!path) return ""
	return path.split("/").pop() ?? ""
}

const isUnlocked = (imgName: string) =>
	settings.eventImages.includes(getPath(imgName))

const cg = {
	shouldBlur,
	getByRoute,
	getVariants,
	getPath,
	getNameFromPath,
	isUnlocked,
}
export default cg


export function imagePathPd(imgName: string): string {
	const img = GALLERY_IMAGES_PD[imgName]
	if (!img) return ""
	
	return `${img.path}/${img.img}`
}