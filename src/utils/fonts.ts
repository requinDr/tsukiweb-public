import { DEFAULT_GAME_FONT } from "@tsukiweb-common/utils/settings"

const loadedFonts = new Set<string>([DEFAULT_GAME_FONT])

/**
 * Load a Google Font dynamically using a link element.
 * @param fontName The exact font name as it appears on Google Fonts
 * @returns Promise<boolean> - true if font loaded successfully
 */
export async function loadGoogleFont(fontName: string): Promise<boolean> {
	if (!fontName || loadedFonts.has(fontName)) {
		return true
	}

	try {
		const encodedFont = fontName.replace(/\s+/g, '+')
		console.debug(`Loading font: ${fontName} from Google Fonts...`)
		const fontUrl = `https://fonts.googleapis.com/css2?family=${encodedFont}:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap`
		
		const existingLink = document.querySelector(`link[href*="${encodedFont}"]`)
		if (existingLink) {
			loadedFonts.add(fontName)
			return true
		}

		const link = document.createElement('link')
		link.rel = 'stylesheet'
		link.href = fontUrl
		
		const loadPromise = new Promise<boolean>((resolve) => {
			link.onload = () => {
				loadedFonts.add(fontName)
				resolve(true)
			}
			link.onerror = () => {
				resolve(false)
			}
			setTimeout(() => resolve(false), 5000)
		})
		
		document.head.appendChild(link)
		return await loadPromise
	} catch (error) {
		console.error(`Failed to load font: ${fontName}`, error)
		return false
	}
}

export function isFontLoaded(fontName: string): boolean {
	return loadedFonts.has(fontName)
}
