import { CharId, GalleryImg } from "types"
import { settings } from "./settings"
import { GALLERY_IMAGES, GALLERY_IMAGES_PD } from "./gallery-data"


function getImg(imgName: string): GalleryImg {
	return GALLERY_IMAGES[imgName]
}

function isInGallery(image: string): boolean {
	return image in GALLERY_IMAGES
}

function shouldBlur(image: string): boolean {
	return (getImg(image)?.sensitive ?? false) && settings.blurThumbnails
}

function getByGroup(group: CharId): string[] {
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


// PLUS-DISC
function getImgPd(imgName: string): GalleryImg {
	return GALLERY_IMAGES_PD[imgName]
}
function shouldBlurPd(image: string): boolean {
	return (getImgPd(image)?.sensitive ?? false) && settings.blurThumbnails
}
export const cgPd = {
	getImg: getImgPd,
	shouldBlur: shouldBlurPd,
}