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

const VOID_FONT_CSS_RULE = "@font-face{font-family:'void';src:url(data:application/font-woff2;charset=utf-8;base64,d09GMgABAAAAAAPQAA0AAAAAJLwAAAN2AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP0ZGVE0cGh4GYACCehEICrcUtUcLgVYAATYCJAODGgQgBYQrB4IOGy8iyD4M2GTIPrT6WF2CYVmsrZSME0Lxo0HkLsnMe3J+bjz8/1jtvj/u6wnzjEfTZlY97lD30CyaNpNQaV4SibwX23xgzQx8YoKmJQvZq6ZBWjJtbams7UgryfyPub1/XCfUSbdKmihiPrNKphKi5QzxL7t7f4Ygsik2JcsCqWjBhCpFOWuA+r3/lb/f/ynl4AsvOYHFxycux78I1qIX+gd5kXU+ZsO7wLswbYM/aGDRxjV8TPCAshIIMC3BsAwDkAAb0NvIC+Bt1UII+PmLFgF/hd0tbtmBKvpAEsJFJIuEZDoXOdKdvlnrANSzuI5ODoqTBnPXWUMoMLdg3mfM5HgyMvzfCugCzEGQYQ45BQFX1ASmGBwDbTaYhJrjHt5r10f62D9QM6cHAk2AuaL8WWyod/QWEE4QLaFWFCqRyTS5fKGWdOtLt+d0B+sPBEPhSDQWTyRT6Uw2ly8US+VKtVZv8IIoyYqqQd9Ny3bcZqvd6fb6g+FoPJnO5ovlar3Z7vYA5ScZ7ex193Bz+4z/ClwC/AB8oXoA1Q/QBEggoUqTYA8V8QP3xWofHHUvrXZRqXfN8qbGV8YZV/BYWfkBegAgFnoLMY558+Pt8rg7Lt/z7D56vHHjeA/kHpUZZIyeL9n5vJD5V237BwsBgH8gRAhBCAmRRAYRurBwyYHg13/L7+pCvTFrmXM6isP3aQYoSiBYmswqCfwfekQgMH26vOBlp5nIt6nNIJs88OmzLcScJXAJBwUBOeW2FwjQk4KAkLULgaTgJAIZWZcRyMq6KUBOxX0B8rLeC1DT8waBuokUYKIpYQXQyFC0nUzq9pMZRReBLHKDzOlbk3lFr8maFR5HqdvkgxFXG6MrdRFjNCViJUaL5+QiVrjAwbN9F7h5QMLZB9QKuCbhOcOWi97AARc3ldBBDi8bFfJTmJ/1iItcwZOIMfIycmDvY6ScyfmvdqFTF5QimmrIbmrhJOdJlQqCBU9IMJG7EXVZ2rAZzfk/h3ThhdtKRD2rDSRULcKD5KXtU+4+qq9BUUlZRVVNXUOTnYOTi5sHjkCi0BgsjpePX0BQSFhEVExcQlJKWkZWTl5BUUlZRVVNXQNPIJLIFCqNwWSxOVxNLW0dXT19A0MjYxNTM3MLSytrG1s7ewffpMhE1htvffTO++5q7O2mciQwb+6tAgAAAA==) format('woff2'), url(data:application/font-woff;charset=utf-8;base64,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) format('woff');}"
let voidFontLoaded = false;
/**
 * List the available fonts from a catalog
 * @param catalog list of font names to test
 * @param testString string to verify the font against
 * @returns the list of available fonts from the {@link catalog}
 */
export function listAvailableFonts(catalog: string[], testString: string = "0123"): string[] {
	
	if (!voidFontLoaded) {
		const stylesheet = document.createElement('style')
		stylesheet.innerText = VOID_FONT_CSS_RULE
		document.head.appendChild(stylesheet)
		voidFontLoaded = true;
		setTimeout(()=> {
			voidFontLoaded = false;
			stylesheet.parentNode?.removeChild(stylesheet)
		}, 10_000) // remove void font after 10 seconds
	}

	const tests = document.createElement("span")
	tests.innerHTML = testString
	tests.style.display = "inline-block"
	tests.style.fontFamily = "void"
	document.body.appendChild(tests)
	const cs = window.getComputedStyle(tests)
	const refw = cs.width
	const result: string[] = []
	for (const font of catalog) {
		tests.style.fontFamily = `${font}, void`
		if (cs.width != refw)
			result.push(font)
	}
	tests.parentNode!.removeChild(tests)
	return result
}
export function isFontAvailable(fontName: string, testString: string = "0123"): boolean {
	return listAvailableFonts([fontName], testString).length > 0
}