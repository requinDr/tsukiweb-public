import { GalleryImg } from "types"

export enum CharactersTabs {
	ark = "ark",
	cel = "cel",
	aki = "aki",
	his = "his",
	koha = "koha",
	ari = "ari",
	stk = "stk",
	nero = "nero",
	roa = "roa",
}


type CharData = {
	name: string
	fullname: string
	height: string
	weight: string
	sex: "M" | "F"
	birthday: string
	bloodType?: string
	desc: string
	sprite: string
	images: string[]
}
export const CHARACTERS_DATA: Record<CharactersTabs, CharData> = {
	[CharactersTabs.ark]: {
		name: "Arcueid",
		fullname: "Arcueid Brunestud",
		height: "167cm",
		weight: "52kg",
		sex: "F",
		birthday: "25 December",
		desc: "",
		sprite: "tachi/ark_t03",
		images: ["bonus/ark1", "bonus/ark2"]
	},
	[CharactersTabs.cel]: {
		name: "Ciel",
		fullname: "Ciel",
		height: "165cm",
		weight: "52kg",
		sex: "F",
		birthday: "3 May",
		bloodType: "O",
		desc: "",
		sprite: "tachi/cel_t02",
		images: ["bonus/ciel1", "bonus/ciel2"]
	},
	[CharactersTabs.aki]: {
		name: "Akiha",
		fullname: "Tohno Akiha",
		height: "160cm",
		weight: "45kg",
		sex: "F",
		birthday: "22 September",
		bloodType: "A",
		desc: "",
		sprite: "tachi/aki_t12a",
		images: ["bonus/aki1", "bonus/aki2"]
	},
	[CharactersTabs.his]: {
		name: "Hisui",
		fullname: "Hisui",
		height: "156cm",
		weight: "43kg",
		sex: "F",
		birthday: "12 March",
		bloodType: "B",
		desc: "",
		sprite: "tachi/his_t04",
		images: ["bonus/hisui"]
	},
	[CharactersTabs.koha]: {
		name: "Kohaku",
		fullname: "Kohaku",
		height: "156cm",
		weight: "43kg",
		sex: "F",
		birthday: "12 March",
		bloodType: "B",
		desc: "",
		sprite: "tachi/koha_t18",
		images: ["bonus/kohaku"]
	},
	[CharactersTabs.ari]: {
		name: "Arihiko",
		fullname: "Inui Arihiko",
		height: "174cm",
		weight: "62kg",
		sex: "M",
		birthday: "24 October",
		bloodType: "B",
		desc: "",
		sprite: "tachi/ari_t01",
		images: []
	},
	[CharactersTabs.stk]: {
		name: "Satsuki",
		fullname: "Yumizuka Satsuki",
		height: "161cm",
		weight: "45kg",
		sex: "F",
		birthday: "15 August",
		bloodType: "A",
		desc: "",
		sprite: "tachi/stk_t03",
		images: []
	},
	[CharactersTabs.nero]: {
		name: "Nrvnqsr",
		fullname: "Nrvnqsr Chaos",
		height: "188cm",
		weight: "84kg",
		sex: "M",
		birthday: "13 February",
		desc: "",
		sprite: "tachi/nero_t01a",
		images: []
	},
	[CharactersTabs.roa]: {
		name: "Roa",
		fullname: "Michael Roa Valdamjong",
		height: "178cm",
		weight: "65kg",
		sex: "M",
		birthday: "29 September",
		bloodType: "A",
		desc: "",
		sprite: "tachi/roa_t01a",
		images: []
	},
}


export const GALLERY_IMAGES_BONUS: Record<string, GalleryImg> = {
	"bonus/ark1" : { name: "ark1" },
	"bonus/ark2" : { name: "ark2" },
	"bonus/ciel1" : { name: "ciel1" },
	"bonus/ciel2" : { name: "ciel2" },
	"bonus/aki1" : { name: "aki1" },
	"bonus/aki2" : { name: "aki2" },
	"bonus/hisui" : { name: "hisui" },
	"bonus/kohaku" : { name: "kohaku" }
}
export function getImgBonus(name: string): GalleryImg {
	return GALLERY_IMAGES_BONUS[name]
}