import { GalleryImg } from "types"
import { settings } from "./settings"
import { GALLERY_IMAGES } from "./gallery-data"


function getImg(imgName: string): GalleryImg {
	return GALLERY_IMAGES[imgName]
}

function isInGallery(image: string): boolean {
	return image in GALLERY_IMAGES
}

function shouldBlur(image: string): boolean {
	return (getImg(image)?.sensitive ?? false) && settings.blurThumbnails
}

function getByGroup(group: GalleryImg["group"]): string[] {
  return Object.entries(GALLERY_IMAGES)
    .filter(([key, img]) => img.group === group)
    .map(([key]) => key);
}

function getAlts(imgName: string): string[] {
  return Object.entries(GALLERY_IMAGES)
    .filter(([key, img]) => img.altOf === imgName)
    .map(([key]) => key);
}

function getNameFromPath(path: string): string {
	if (!path) return ""
	return path.split("/").pop() ?? ""
}

const isUnlocked = (img: string) =>
	settings.eventImages.includes(img)

const cg = {
	getImg,
	getByGroup,
	getAlts,
	getNameFromPath,
	shouldBlur,
	isUnlocked,
	isInGallery,
}
export default cg
