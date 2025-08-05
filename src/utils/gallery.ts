import { CharId, GalleryImg } from "types"
import { settings } from "./settings"
import { GALLERY_IMAGES, GALLERY_IMAGES_PD } from "./gallery-data"


function getImg(imgName: string): GalleryImg | undefined {
	return GALLERY_IMAGES[imgName]
}

function shouldBlur(image: string): boolean {
	return (getImg(image)?.sensitive ?? false) && settings.blurThumbnails
}

function getByGroup(group: CharId): GalleryImg[] {
	return Object.values(GALLERY_IMAGES).filter((img) => img.group === group)
}

function getAlts(imgName: string): GalleryImg[] {
	return Object.values(GALLERY_IMAGES).filter((img) => img.altOf === imgName || img.name === imgName)
}

function getPath(imgName: string): string {
	const img = getImg(imgName)
	if (!img) return ""

	return `${img.path}/${img.name}`
}

function getNameFromPath(path: string): string {
	if (!path) return ""
	return path.split("/").pop() ?? ""
}

const isUnlocked = (imgName: string) =>
	settings.eventImages.includes(getPath(imgName))

const cg = {
	getImg,
	getByGroup,
	getAlts,
	getPath,
	getNameFromPath,
	shouldBlur,
	isUnlocked,
}
export default cg


export function imagePathPd(imgName: string): string {
	const img = GALLERY_IMAGES_PD[imgName]
	if (!img) return ""
	
	return `${img.path}/${img.name}`
}