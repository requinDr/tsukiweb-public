import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const prefixPath = '../../public/static/jp/image_thumb/'
const outputDir = 'output/thumbnails/'
const width = 108
const height = 72

const ensureWebpExtension = (filePath) => (filePath ? `${filePath}.webp` : null)

const isHexColor = (str) => /^#[0-9A-Fa-f]{6}$/.test(str)

async function processScenes(scenes, outputDir, prefixPath, width, height) {
	// Ensure the output directory exists
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true })
	}

	const batchSize = 90 // Number of thumbnails per spritesheet
	let batchIndex = 0
	let thumbnails = []
	let jsonMetadata = {}

	for (const [sceneName, sceneData] of Object.entries(scenes)) {
		const graph = sceneData?.fc?.graph

		if (graph) {
			let { bg, l = null, c = null, r = null, monochrome = null } = graph

			if (!bg) {
				bg = "#000000"
			}

			try {
				// Generate thumbnail buffer
				const thumbBuffer = await generateFlowchartImage({
					bg: isHexColor(bg) ? bg : path.join(prefixPath, ensureWebpExtension(bg)),
					l: l ? path.join(prefixPath, ensureWebpExtension(l)) : null,
					c: c ? path.join(prefixPath, ensureWebpExtension(c)) : null,
					r: r ? path.join(prefixPath, ensureWebpExtension(r)) : null,
					monochrome,
					width,
					height,
				})

				thumbnails.push(thumbBuffer)

				const batchPosition = thumbnails.length - 1

				// Calculate metadata for this scene
				jsonMetadata[sceneName] = {
					file: `spritesheet_${batchIndex}.webp`,
					top: Math.floor(batchPosition / 10) * height, // Assuming 10 columns
					left: (batchPosition % 10) * width,
					width,
					height,
				}

				// Save spritesheet when batch is full
				if (thumbnails.length === batchSize) {
					await saveSpritesheet(thumbnails, outputDir, batchIndex, width, height)
					thumbnails = []
					batchIndex++
				}
			} catch (error) {
				console.error(`Error processing scene ${sceneName}:`, error.message)
			}
		} else {
			console.warn(`Skipping scene ${sceneName} due to missing graph data`)
		}
	}

	// Save remaining thumbnails in the last batch
	if (thumbnails.length > 0) {
		await saveSpritesheet(thumbnails, outputDir, batchIndex, width, height)
	}

	// Write JSON metadata
	const metadataPath = path.join(outputDir, "spritesheet_metadata.json")
	fs.writeFileSync(metadataPath, JSON.stringify(jsonMetadata, null, 2))
	console.log(`Metadata saved to ${metadataPath}`)
}

// Helper function to generate a spritesheet
async function saveSpritesheet(thumbnails, outputDir, batchIndex, thumbWidth, thumbHeight) {
	const cols = 10 // Number of thumbnails per row
	const rows = Math.ceil(thumbnails.length / cols)
	const spritesheetPath = path.join(outputDir, `spritesheet_${batchIndex}.webp`)

	const compositeImages = thumbnails.map((thumb, i) => ({
		input: thumb,
		left: (i % cols) * thumbWidth,
		top: Math.floor(i / cols) * thumbHeight,
	}))

	const canvas = sharp({
		create: {
			width: cols * thumbWidth,
			height: rows * thumbHeight,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})

	await canvas.composite(compositeImages).toFormat('webp').toFile(spritesheetPath)
	console.log(`Spritesheet saved to ${spritesheetPath}`)
}

// Updated generateFlowchartImage to return buffer instead of saving
async function generateFlowchartImage({ bg, l, c, r, monochrome, width, height, output }) {
	const canvas = sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})

	const layers = []

	const applyGrayscale = (inputImage) => {
		if (monochrome) {
			return inputImage.grayscale().toBuffer()
		}
		return inputImage.toBuffer()
	}

	// Check if the background is a hex color or an image path
	if (isHexColor(bg)) {
		// If it's a hex color, use it as the background
		const hexColor = bg
		const [r, g, b] = [
			parseInt(hexColor.slice(1, 3), 16),
			parseInt(hexColor.slice(3, 5), 16),
			parseInt(hexColor.slice(5, 7), 16),
		]

		// Add a solid color background layer
		layers.push({
			input: Buffer.from(
				`<svg width="${width}" height="${height}">
						<rect x="0" y="0" width="${width}" height="${height}" fill="rgb(${r},${g},${b})"/>
				</svg>`
			),
			top: 0,
			left: 0,
		})
	} else {
		const bgBuffer = await sharp(bg).resize(width, height).toBuffer()
		const finalBgBuffer = await applyGrayscale(sharp(bgBuffer)) // Apply grayscale if monochrome is specified
		layers.push({ input: finalBgBuffer, top: 0, left: 0 })
	}

	const characterGrid = {
		l: { left: 0, top: 0, width: Math.floor(width / 2), height },
		c: { left: Math.floor(width / 4), top: 0, width: Math.floor(width / 2), height },
		r: { left: Math.floor(width / 2), top: 0, width: Math.floor(width / 2), height },
	}

	const resizeAndCenterCharacter = async (characterPath, position) => {
		if (!characterPath) return null

		// Resize the character, keeping the aspect ratio and filling the height
		const charImage = sharp(characterPath)
		const { width: originalWidth, height: originalHeight } = await charImage.metadata()

		const scaleFactor = height / originalHeight
		const newWidth = Math.round(originalWidth * scaleFactor)

		// Resize the character image
		const resizedBuffer = await charImage.resize(newWidth, height, { fit: 'cover' }).toBuffer()

		const { left, top, width: containerWidth, height: containerHeight } = characterGrid[position]

		// Calculate the offset to center the character
		const overflowX = Math.max(0, newWidth - containerWidth)
		const centerX = left + Math.floor((containerWidth - newWidth) / 2)

		// Ensure that the character's horizontal position is adjusted properly
		const adjustedLeft = (newWidth <= containerWidth) ? centerX : left

		return {
			input: resizedBuffer,
			top: Math.round(top),
			left: Math.round(adjustedLeft - overflowX / 2), // Allow overflow on both sides
		}
	}

	// Add character layers with optional grayscale
	for (const [position, path] of Object.entries({ l, c, r })) {
		if (path) {
			const characterLayer = await resizeAndCenterCharacter(path, position)
			if (characterLayer) {
				const characterImage = sharp(characterLayer.input)
				const grayCharacterImage = await applyGrayscale(characterImage) // Apply grayscale only if monochrome is present
				layers.push({ input: grayCharacterImage, top: characterLayer.top, left: characterLayer.left })
			}
		}
	}

	// Apply the monochrome filter (the layer on top of everything)
	if (monochrome) {
		const [r, g, b] = [
			parseInt(monochrome.slice(1, 3), 16),
			parseInt(monochrome.slice(3, 5), 16),
			parseInt(monochrome.slice(5, 7), 16),
		]

		// Create a monochrome layer (this mimics the CSS "mix-blend-mode: multiply")
		const monochromeLayer = Buffer.from(
			`<svg width="${width}" height="${height}">
					<rect x="0" y="0" width="${width}" height="${height}" fill="rgb(${r},${g},${b})"/>
			</svg>`
		)

		layers.push({
			input: monochromeLayer,
			top: 0,
			left: 0,
			blend: 'multiply',
		})
	}

	// Composite all layers and save the final image
	return canvas.composite(layers).toFormat('webp').toBuffer()

	// console.log(Image saved to ${output})
}


const scenes = {
	"openning": { "title": "Prologue - Glass Moon", "fc": { "col": 0, "from": [], "graph": { "bg": "bg/ima_01" } } },
	// "eclipse": {"title": "Epilogue"},
	// "ending": {"title": "Credits"},

	"s20": { "r": "ark", "d": "01a", "s": "1", "fc": { "col": 0, "from": ["openning"], "graph": { "bg": "bg/cmo_01" } } },
	"s21": { "r": "ark", "d": "01a", "s": "2a", "fc": { "col": 0, "from": ["s20"], "graph": { "bg": "bg/bg_06a", "l": "tachi/ari_t01", "r": "tachi/stk_t01" } } },
	"s22": { "r": "ark", "d": "01a", "s": "2b", "fc": { "col": 3, "from": ["s20"], "graph": { "bg": "event/cel_e01" } } },
	"s23": { "r": "ark", "d": "01a", "s": "3a", "fc": { "col": 3, "from": ["s22"], "graph": { "bg": "bg/bg_06a" } } },
	"s24": { "r": "ark", "d": "01a", "s": "3b", "fc": { "col": 0, "from": ["s21"], "graph": { "bg": "bg/bg_06a" } } },
	"s25": { "r": "ark", "d": "01a", "s": "4a", "fc": { "col": 3, "from": ["s23"], "graph": { "bg": "bg/bg_06a" } } },
	"s26": { "r": "ark", "d": "01a", "s": "4b", "fc": { "col": 4, "from": ["s23"], "graph": { "bg": "bg/bg_50", "c": "tachi/ari_t05" } } },
	"s27": { "r": "ark", "d": "01a", "s": "4c", "fc": { "col": 5, "from": ["s23"], "graph": { "bg": "bg/bg_11a", "c": "tachi/cel_t03" } } },
	"s28": { "r": "ark", "d": "01a", "s": "4d", "fc": { "col": 0, "from": ["s24"], "graph": { "bg": "bg/bg_11a" } } },
	"s29": { "r": "ark", "d": "01a", "s": "4e", "fc": { "col": 1, "from": ["s24"], "graph": { "bg": "bg/bg_50", "l": "tachi/cel_t03", "r": "tachi/ari_t01" } } },
	"s30": { "r": "ark", "d": "01a", "s": "4f", "fc": { "col": 2, "from": ["s24"], "graph": { "bg": "bg/bg_06a", "l": "tachi/cel_t04", "r": "tachi/ari_t05" } } },
	"s31": { "r": "ark", "d": "01a", "s": "5", "fc": { "col": 0, "from": ["s25", "s26", "s27", "s28", "s29", "s30"], "graph": { "bg": "bg/bg_06b" } } },
	"s33": { "r": "ark", "d": "01a", "s": "6a", "fc": { "col": 3, "from": ["s31"], "graph": { "bg": "bg/bg_11b", "c": "tachi/cel_t01a" } } },
	"s34": { "r": "ark", "d": "01a", "s": "6b", "fc": { "col": 4, "from": ["s33"], "graph": { "bg": "bg/bg_09b", "c": "tachi/cel_t07a" } } },
	"s89": { "r": "ark", "d": "01a", "s": "6c", "fc": { "col": 3, "from": ["s33"], "graph": { "bg": "bg/bg_09b", "c": "tachi/cel_t03" } } },
	"s35": { "r": "ark", "d": "01a", "s": "6d", "fc": { "col": 1, "from": ["s31"], "graph": { "bg": "event/stk_e03" } } },
	"s502": { "r": "ark", "d": "01a", "s": "6e", "fc": { "col": 2, "from": ["s31"], "graph": { "bg": "event/stk_e03" } } },
	"s36": { "r": "ark", "d": "01a", "s": "7a", "fc": { "col": 0, "from": ["b36"], "graph": { "bg": "bg/bg_22b" } } },
	"s37": { "r": "ark", "d": "01a", "s": "7b", "fc": { "col": 1, "from": ["b36"], "graph": { "bg": "bg/bg_22b" } } },
	"s201": { "r": "ark", "d": "01a", "s": "7c", "fc": { "col": 2, "from": ["b36"], "graph": { "bg": "bg/bg_22b" } } },
	"s40": { "r": "ark", "d": "01a", "s": "8a", "fc": { "col": 0, "from": ["b40"], "graph": { "bg": "event/aki_e01" } } },
	"s39": { "r": "ark", "d": "01a", "s": "8b", "fc": { "col": 1, "from": ["b40"], "graph": { "bg": "event/his_e01" } } },
	"s202": { "r": "ark", "d": "01a", "s": "8c", "fc": { "col": 2, "from": ["b40"], "graph": { "bg": "event/his_e02" } } },
	"s41": { "r": "ark", "d": "01a", "s": "9", "fc": { "col": 1, "from": ["s39", "s202"], "graph": { "bg": "bg/bg_33b", "c": "tachi/koha_t05" } } },
	"s42": { "r": "ark", "d": "01a", "s": "10", "fc": { "col": 0, "from": ["s40", "s41"], "graph": { "bg": "bg/bg_40c" } } },
	"s43": { "r": "ark", "d": "01a", "s": "11a", "fc": { "col": 0, "from": ["s42"], "graph": { "bg": "bg/bg_34b", "c": "tachi/aki_t04b" } } },
	"s44": { "r": "ark", "d": "01a", "s": "11b", "fc": { "col": 1, "from": ["s42"], "graph": { "bg": "event/his_e08" } } },
	"s45": { "r": "ark", "d": "01a", "s": "11c", "fc": { "col": 2, "from": ["s42"], "graph": { "bg": "bg/bg_39", "c": "tachi/koha_t02b" } } },
	"s46": { "r": "ark", "d": "01a", "s": "12a", "fc": { "col": 1, "from": ["b46"], "graph": { "bg": "bg/bg_40d" } } },
	"s47": { "r": "ark", "d": "01a", "s": "12b", "fc": { "col": 0, "from": ["b46"], "graph": { "bg": "bg/bg_40d" } } },
	"s47a": { "r": "ark", "d": "01a", "s": "13a", "fc": { "col": 0, "from": ["s47", "a46"], "graph": { "bg": "bg/bg_47", "c": "tachi/nero_t03" } } },
	"s48": { "r": "ark", "d": "01a", "s": "13b", "fc": { "col": 10, "from": ["s46"], "align": "s47a", "graph": { "bg": "bg/bg_46c" } } },
	"s49": { "r": "ark", "d": "01a", "s": "13c", "fc": { "col": 11, "from": ["s46"], "align": "s48", "graph": { "bg": "bg/cmo_20" } } },
	"s203": { "r": "ark", "d": "01a", "s": "13d", "fc": { "col": 12, "from": ["s46"], "align": "s48", "graph": { "bg": "bg/bg_46c" } } },
	"s51": { "r": "ark", "d": "02a", "s": "1a", "fc": { "col": 0, "from": ["s47a"], "graph": { "bg": "bg/bg_40e", "c": "tachi/his_t01" } } },
	"s204": { "r": "ark", "d": "02a", "s": "1b", "fc": { "col": 10, "from": ["s48"], "graph": { "bg": "bg/cmo_05" } } },
	"s205": { "r": "ark", "d": "02a", "s": "1c", "fc": { "col": 11, "from": ["s49", "s203"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t23" } } },
	"s54": { "r": "ark", "d": "02a", "s": "2a", "fc": { "col": 0, "from": ["s51"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t01a" } } },
	"s55": { "r": "ark", "d": "02a", "s": "2b", "fc": { "col": 1, "from": ["s51"], "graph": { "bg": "bg/bg_34a", "c": "tachi/koha_t05" } } },
	"s56": { "r": "ark", "d": "02a", "s": "2c", "fc": { "col": 2, "from": ["s51"], "graph": { "bg": "bg/bg_34a", "l": "tachi/aki_t01a", "r": "tachi/koha_t01a" } } },
	"s304": { "r": "ark", "d": "02a", "s": "2d", "fc": { "col": 10, "from": ["a204"], "graph": { "bg": "bg/bg_34a", "l": "tachi/aki_t01a" } } },
	"s123": { "r": "ark", "d": "02a", "s": "2e", "fc": { "col": 11, "from": ["a204"], "graph": { "bg": "bg/bg_34a", "r": "tachi/koha_t05" } } },
	"s124": { "r": "ark", "d": "02a", "s": "2f", "fc": { "col": 12, "from": ["a204"], "graph": { "bg": "bg/bg_34a", "l": "tachi/aki_t01a", "r": "tachi/koha_t01a" } } },
	"s57": { "r": "ark", "d": "02a", "s": "3a", "fc": { "col": 0, "from": ["s54", "s55", "s56"], "graph": { "bg": "bg/bg_33a", "l": "tachi/his_t01", "r": "tachi/koha_t02" } } },
	"s206": { "r": "ark", "d": "02a", "s": "3b", "fc": { "col": 10, "from": ["s304", "s123", "s124"], "graph": { "bg": "bg/bg_33a", "l": "tachi/his_t01", "r": "tachi/koha_t02" } } },
	"s58": { "r": "ark", "d": "02a", "s": "4a", "fc": { "col": 0, "from": ["s57"], "graph": { "bg": "bg/bg_06a" } } },
	"s59": { "r": "ark", "d": "02a", "s": "4b", "fc": { "col": 2, "from": ["s57"], "graph": { "bg": "bg/bg_06a" } } },
	"s207": { "r": "ark", "d": "02a", "s": "4c", "fc": { "col": 10, "from": ["s206"], "graph": { "bg": "bg/bg_06a" } } },
	"s208": { "r": "ark", "d": "02a", "s": "4d", "fc": { "col": 11, "from": ["s206"], "graph": { "bg": "bg/bg_06a" } } },
	"s60": { "r": "ark", "d": "02a", "s": "5a", "fc": { "col": 0, "from": ["s58"], "graph": { "bg": "bg/bg_06a" } } },
	"s61": { "r": "ark", "d": "02a", "s": "5b", "fc": { "col": 1, "from": ["s58"], "graph": { "bg": "bg/bg_50" } } },
	"s62": { "r": "ark", "d": "02a", "s": "5c", "fc": { "col": 2, "from": ["s59"], "graph": { "bg": "bg/bg_06a" } } },
	"s63": { "r": "ark", "d": "02a", "s": "5d", "fc": { "col": 3, "from": ["s59"], "graph": { "bg": "bg/bg_50" } } },
	"s64": { "r": "ark", "d": "02a", "s": "5e", "fc": { "col": 4, "from": ["s59"], "graph": { "bg": "event/cel_e02a" } } },
	"s209": { "r": "ark", "d": "02a", "s": "5f", "fc": { "col": 10, "from": ["a208"], "graph": { "bg": "bg/bg_06a", "c": "tachi/cel_t09" } } },
	"s210": { "r": "ark", "d": "02a", "s": "5g", "fc": { "col": 11, "from": ["a208"], "graph": { "bg": "bg/bg_06a", "c": "tachi/cel_t08" } } },
	"s65": { "r": "ark", "d": "02a", "s": "6a", "fc": { "col": 0, "from": ["s60", "s61", "s62", "s63", "s64"], "graph": { "bg": "event/ark_e01" } } },
	"s209a": { "r": "ark", "d": "02a", "s": "6b", "fc": { "col": 10, "from": ["a210", "s209"], "graph": { "bg": "bg/bg_24c", "c": "tachi/ark_t22" } } },
	"s212": { "r": "ark", "d": "02a", "s": "6c", "fc": { "col": 11, "from": ["s210"], "align": "s209a", "graph": { "bg": "bg/bg_32b", "c": "tachi/his_t16" } } },
	"s66": { "r": "ark", "d": "02a", "s": "7a", "fc": { "col": 0, "from": ["s65"], "graph": { "bg": "bg/bg_40c", "c": "tachi/his_t01" } } },
	"s67": { "r": "ark", "d": "02a", "s": "7b", "fc": { "col": 1, "from": ["s65"], "graph": { "bg": "bg/bg_40c", "c": "tachi/his_t08" } } },
	"s68": { "r": "ark", "d": "02a", "s": "7c", "fc": { "col": 3, "from": ["s65"], "graph": { "bg": "bg/bg_28b", "c": "tachi/cel_t13" } } },
	"s214": { "r": "ark", "d": "02a", "s": "7d", "fc": { "col": 11, "from": ["s212"], "graph": { "bg": "event/his_e04" } } },
	"s213": { "r": "ark", "d": "02a", "s": "7e", "fc": { "col": 12, "from": ["s212"], "graph": { "bg": "bg/bg_42b", "c": "tachi/koha_t06" } } },
	"s215": { "r": "ark", "d": "02a", "s": "7f", "fc": { "col": 13, "from": ["s212"], "graph": { "bg": "bg/bg_40b" } } },
	"s216": { "r": "ark", "d": "02a", "s": "8", "fc": { "col": 11, "from": ["s214", "s213", "s215"], "graph": { "bg": "bg/bg_48c", "c": "tachi/koha_t01a" } } },
	"s211": { "r": "ark", "d": "02a", "s": "9", "fc": { "col": 10, "from": ["s209a", "s216"], "graph": { "bg": "bg/bg_25b" } } },
	"s217": { "r": "ark", "d": "02a", "s": "10a", "fc": { "col": 11, "from": ["s211"], "graph": { "bg": "bg/bg_31b", "c": "tachi/stk_t06" } } },
	"s218": { "r": "ark", "d": "02a", "s": "10b", "fc": { "col": 10, "from": ["s211"], "graph": { "bg": "bg/bg_31b", "c": "tachi/stk_t06" } } },
	"s69": { "r": "ark", "d": "03a", "s": "1a", "fc": { "col": 0, "from": ["s66", "s67"], "graph": { "bg": "bg/bg_33a", "c": "tachi/koha_t01a" } } },
	"s74": { "r": "ark", "d": "03a", "s": "1b", "fc": { "col": 3, "from": ["s68"], "graph": { "bg": "bg/bg_18a", "c": "tachi/cel_t01a" } } },
	"s70": { "r": "ark", "d": "03a", "s": "2a", "fc": { "col": 0, "from": ["s69"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t16a" } } },
	"s71": { "r": "ark", "d": "03a", "s": "2b", "fc": { "col": 1, "from": ["s69"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t01a" } } },
	"s72": { "r": "ark", "d": "03a", "s": "2c", "fc": { "col": 2, "from": ["s69"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t04a" } } },
	"s73": { "r": "ark", "d": "03a", "s": "3", "fc": { "col": 0, "from": ["s70", "s71", "s72"], "graph": { "bg": "event/ark_e02" } } },
	"s75": { "r": "ark", "d": "03a", "s": "4", "fc": { "col": 0, "from": ["s73", "s74"], "graph": { "bg": "bg/bg_31a", "c": "tachi/kemo_t02" } } },
	"s76": { "r": "ark", "d": "03a", "s": "5a", "fc": { "col": 0, "from": ["s75"], "graph": { "bg": "bg/bg_31a", "c": "tachi/ark_t08" } } },
	"s77": { "r": "ark", "d": "03a", "s": "5b", "fc": { "col": 1, "from": ["s75"], "graph": { "bg": "bg/bg_31a", "c": "tachi/ark_t23", "monochrome": "#ff0000" } } },
	"s78": { "r": "ark", "d": "03a", "s": "5c", "fc": { "col": 2, "from": ["s75"], "graph": { "bg": "bg/bg_31a", "c": "tachi/ark_t06" } } },
	"s79": { "r": "ark", "d": "03a", "s": "6", "fc": { "col": 1, "from": ["b79"], "graph": { "bg": "bg/bg_25a", "c": "tachi/ark_t03" } } },
	"s80": { "r": "ark", "d": "03a", "s": "7", "fc": { "col": 0, "from": ["s79", "b79"], "graph": { "bg": "bg/bg_19b", "c": "tachi/ark_t08" } } },
	"s84": { "r": "ark", "d": "03a", "s": "8a", "fc": { "col": 0, "from": ["s80"], "graph": { "bg": "bg/bg_28a" } } },
	"s81": { "r": "ark", "d": "03a", "s": "8b", "fc": { "col": 2, "from": ["s80"], "graph": { "bg": "bg/cmo_06", "monochrome": "#ff0000" } } },
	"s82": { "r": "ark", "d": "03a", "s": "9a", "fc": { "col": 2, "from": ["s81"], "graph": { "bg": "bg/bg_19d", "c": "tachi/ark_t07", "monochrome": "#ff00ff" } } },
	"s83": { "r": "ark", "d": "03a", "s": "9b", "fc": { "col": 3, "from": ["s81"], "graph": { "bg": "bg/bg_19d", "c": "tachi/ark_t16" } } },
	"s86": { "r": "ark", "d": "03a", "s": "9", "fc": { "col": 0, "from": ["s84"], "graph": { "c": "tachi/nero_t01a" } }, "deadEnd": true },
	"s511": { "r": "ark", "d": "03a", "s": "9", "osiete": true },
	"s87": { "r": "ark", "d": "03a", "s": "9c", "fc": { "col": 1, "from": ["s84"], "graph": { "bg": "bg/bg_19c", "c": "tachi/ark_t16" } } },
	"s88": { "r": "ark", "d": "03a", "s": "10", "fc": { "col": 0, "from": ["s82", "s83", "s87"], "graph": { "bg": "bg/cmo_16" } } },
	"s85": { "r": "ark", "d": "03a", "s": "11", "fc": { "col": 2, "from": ["s88"], "graph": { "bg": "bg/ima_12" } }, "deadEnd": true },
	"s512": { "r": "ark", "d": "03a", "s": "11", "osiete": true },
	"s90": { "r": "ark", "d": "03a", "s": "11a", "fc": { "col": 0, "from": ["s88"], "graph": { "bg": "bg/bg_20b", "c": "tachi/nero_t03" } } },
	"s91": { "r": "ark", "d": "03a", "s": "11b", "fc": { "col": 1, "from": ["s88"], "graph": { "bg": "bg/bg_20b", "monochrome": "#0f00f0" } } },
	"s92": { "r": "ark", "d": "03a", "s": "12", "fc": { "col": 2, "from": ["s91"], "graph": { "bg": "#000000" } }, "deadEnd": true },
	"s513": { "r": "ark", "d": "03a", "s": "12", "osiete": true },
	"s93": { "r": "ark", "d": "03a", "s": "12", "fc": { "col": 1, "from": ["s91"], "graph": { "bg": "bg/ima_11b", "c": "tachi/nero_t01a" } } },
	"s94": { "r": "ark", "d": "04a", "s": "1a", "fc": { "col": 0, "from": ["s90"], "align": "s98", "graph": { "bg": "bg/bg_15c", "c": "tachi/ark_t21" } } },
	"s98": { "r": "ark", "d": "04a", "s": "1b", "fc": { "col": 1, "from": ["s93"], "graph": { "bg": "bg/bg_15a", "c": "tachi/ark_t12" } } },
	"s95": { "r": "ark", "d": "04a", "s": "2a", "fc": { "col": 0, "from": ["a94"], "graph": { "bg": "bg/bg_15c", "c": "tachi/ark_t02" } } },
	"s96": { "r": "ark", "d": "04a", "s": "2b", "fc": { "col": 1, "from": ["a94"], "graph": { "bg": "bg/bg_15c", "c": "tachi/ark_t11" } } },
	"s97": { "r": "ark", "d": "04a", "s": "3", "fc": { "col": 0, "from": ["s95", "s96"], "graph": { "bg": "bg/bg_29b", "c": "tachi/nero_t01a" } } },
	"s99": { "r": "ark", "d": "04a", "s": "4", "fc": { "col": 1, "from": ["s97"], "graph": { "bg": "bg/bg_29c", "c": "tachi/nero_t02c" } } },
	"s100": { "r": "ark", "d": "04a", "s": "5", "fc": { "col": 1, "from": ["s99"], "align": "s101", "graph": { "bg": "bg/bg_29c" } }, "deadEnd": true },
	"s514": { "r": "ark", "d": "04a", "s": "5", "osiete": true },
	"s101": { "r": "ark", "d": "04a", "s": "5", "fc": { "col": 0, "from": ["s97", "a99"], "graph": { "bg": "event/ark_e03" } } },
	"s102": { "r": "ark", "d": "04a", "s": "6a", "fc": { "col": 0, "from": ["s101"], "graph": { "bg": "#000000" } } },
	"s103": { "r": "ark", "d": "04a", "s": "6b", "fc": { "col": 1, "from": ["s101"], "graph": { "c": "tachi/kemo_t05" } } },
	"s104": { "r": "ark", "d": "04a", "s": "7", "fc": { "col": 0, "from": ["s102", "s103"], "graph": { "bg": "event/nero_e04" } } },
	"s105": { "r": "ark", "d": "04a", "s": "8a", "fc": { "col": 0, "from": ["s104"], "graph": { "bg": "bg/ima_18" } } },
	"s106": { "r": "ark", "d": "04a", "s": "8b", "fc": { "col": 6, "from": ["s104"], "graph": { "bg": "event/cel_e04" } } },
	"s108": { "r": "ark", "d": "05a", "s": "1", "fc": { "col": 0, "from": ["s105"], "graph": { "bg": "bg/bg_40e", "c": "tachi/his_t01" } } },
	"s109": { "r": "ark", "d": "05a", "s": "2a", "fc": { "col": 0, "from": ["s108"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t01a" } } },
	"s110": { "r": "ark", "d": "05a", "s": "2b", "fc": { "col": 1, "from": ["s108"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t15a" } } },
	"s111": { "r": "ark", "d": "05a", "s": "2c", "fc": { "col": 2, "from": ["s108"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t10" } } },
	"s112": { "r": "ark", "d": "05a", "s": "3", "fc": { "col": 0, "from": ["s109", "s110", "s111"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t01a" } } },
	"s113": { "r": "ark", "d": "05a", "s": "4a", "fc": { "col": 0, "from": ["s112"], "graph": { "bg": "bg/bg_25a", "c": "tachi/ark_t22" } } },
	"s114": { "r": "ark", "d": "05a", "s": "4b", "fc": { "col": 1, "from": ["s112"], "graph": { "bg": "bg/bg_06b", "c": "tachi/cel_t01a" } } },
	"s115": { "r": "ark", "d": "05a", "s": "4c", "fc": { "col": 2, "from": ["s112"], "graph": { "bg": "bg/bg_06b" } } },
	"s116": { "r": "ark", "d": "05a", "s": "5", "fc": { "col": 0, "from": ["s113", "s114", "s115"], "graph": { "bg": "bg/bg_32b", "c": "tachi/his_t01" } } },
	"s116a": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "05a", "s": { "flg": "E", "0": "6", "1": "11" }, "fc": { "col": 0, "from": ["s116", "s233"], "graph": { "bg": "#000000" } } },
	"s118": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "05a", "s": { "flg": "E", "0": "7a", "1": "12a" }, "fc": { "col": 0, "from": ["s116a"], "graph": { "bg": "event/ark_h01" } }, "h": true },
	"s119": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "05a", "s": { "flg": "E", "0": "7b", "1": "12b" }, "fc": { "col": 1, "from": ["s116a"], "graph": { "bg": "event/cel_h01" } }, "h": true },
	"s120": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "05a", "s": { "flg": "E", "0": "7c", "1": "12c" }, "fc": { "col": 2, "from": ["s116a"], "graph": { "bg": "event/aki_h15" } }, "h": true },
	"s121": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "05a", "s": { "flg": "E", "0": "7d", "1": "12d" }, "fc": { "col": 3, "from": ["s116a"], "graph": { "bg": "event/his_h15" } }, "h": true, "//": "day=6 inside scene" },
	"s122": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "05a", "s": { "flg": "E", "0": "7e", "1": "12e" }, "fc": { "col": 4, "from": ["s116a"], "graph": { "bg": "event/koha_h10" } }, "h": true },
	"s125": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "06a", "s": "1a", "fc": { "col": 0, "from": ["s118"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t01" } } },
	"s126": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "06a", "s": "1b", "fc": { "col": 1, "from": ["s119"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t01" } } },
	"s128": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "06a", "s": "1c", "fc": { "col": 2, "from": ["s120"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t01" } } },
	"s127": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "06a", "s": "1d", "fc": { "col": 4, "from": ["s122"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t01" } } },
	"s129": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "06a", "s": "2", "fc": { "col": 0, "from": ["s125", "s126", "s128", "s121", "s127"], "graph": { "bg": "bg/bg_01a" } } },
	"s130": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "06a", "s": "3a", "fc": { "col": 0, "from": ["s129"], "graph": { "bg": "bg/bg_11a", "c": "tachi/cel_t08" } } },
	"s131": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "06a", "s": "3b", "fc": { "col": 1, "from": ["s129"], "graph": { "bg": "bg/bg_06a", "c": "tachi/cel_t10a" } } },
	"s132": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "06a", "s": "3c", "fc": { "col": 2, "from": ["s129"], "graph": { "bg": "bg/bg_11a", "c": "tachi/cel_t06a" } } },
	"s133": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "06a", "s": "4a", "fc": { "col": 0, "from": ["b133"], "graph": { "bg": "bg/bg_11a", "c": "tachi/cel_t03" } } },
	"s134": { "r": { "flg": "E", "0": "ark", "1": "cel" }, "d": "06a", "s": "4b", "fc": { "col": 1, "from": ["b133"], "graph": { "bg": "bg/bg_11a", "c": "tachi/cel_t07a" } } },
	"s135": { "r": "ark", "d": "06a", "s": "5", "fc": { "col": 0, "from": ["b135"], "graph": { "bg": "bg/bg_06a", "c": "tachi/ari_t05" } } },
	"s138": { "r": "ark", "d": "06a", "s": "6a", "fc": { "col": 0, "from": ["s135"], "graph": { "bg": "bg/bg_25b" } } },
	"s136": { "r": "ark", "d": "06a", "s": "6b", "fc": { "col": 1, "from": ["s135"], "graph": { "bg": "bg/bg_40c" } } },
	"s137": { "r": "ark", "d": "06a", "s": "6c", "fc": { "col": 2, "from": ["s135"], "graph": { "bg": "event/ark_e08" } } },
	"s139": { "r": "ark", "d": "06a", "s": "7", "fc": { "col": 0, "from": ["s138", "s136", "s137"], "graph": { "bg": "bg/bg_29b", "c": "tachi/ark_t01b" } } },
	"s140": { "r": "ark", "d": "06a", "s": "8a", "fc": { "col": 0, "from": ["s139"], "graph": { "bg": "bg/bg_29b", "c": "tachi/ark_t12" } }, "h": true },
	"s141": { "r": "ark", "d": "06a", "s": "8b", "fc": { "col": 1, "from": ["s139"], "graph": { "bg": "bg/bg_29b", "c": "tachi/ark_t11" } } },
	"s142": { "r": "ark", "d": "06a", "s": "9", "fc": { "col": 0, "from": ["s140", "s141"], "graph": { "bg": "bg/bg_26a", "c": "tachi/man_t03" } } },
	"s143": { "r": "ark", "d": "07a", "s": "1a", "fc": { "col": 0, "from": ["s142"], "graph": { "bg": "bg/bg_40e" } } },
	"s144": { "r": "ark", "d": "07a", "s": "1b", "fc": { "col": 3, "from": ["s142"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t09" } } },
	"s145": { "r": "ark", "d": "07a", "s": "1c", "fc": { "col": 4, "from": ["s142"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t08" } } },
	"s146": { "r": "ark", "d": "07a", "s": "2a", "fc": { "col": 0, "from": ["s143"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t02" } } },
	"s147": { "r": "ark", "d": "07a", "s": "2b", "fc": { "col": 1, "from": ["s143"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t04a" } } },
	"s148": { "r": "ark", "d": "07a", "s": "2c", "fc": { "col": 2, "from": ["s143"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t11a" } } },
	"s149": { "r": "ark", "d": "07a", "s": "3", "fc": { "col": 0, "from": ["s144", "s145", "s146", "s147", "s148"], "graph": { "bg": "event/ark_e09" } } },
	"s150": { "r": "ark", "d": "07a", "s": "4a", "fc": { "col": 0, "from": ["s149"], "graph": { "bg": "bg/bg_04", "c": "tachi/ark_t08" } } },
	"s151": { "r": "ark", "d": "07a", "s": "4b", "fc": { "col": 1, "from": ["s149"], "graph": { "bg": "bg/bg_05a", "l": "tachi/ark_t07", "r": "tachi/cel_t06a" } } },
	"s152": { "r": "ark", "d": "07a", "s": "4c", "fc": { "col": 2, "from": ["s149"], "graph": { "bg": "bg/bg_50" } } },
	"s153": { "r": "ark", "d": "07a", "s": "5", "fc": { "col": 0, "from": ["s150", "s151", "s152"], "graph": { "bg": "bg/bg_33b", "c": "tachi/his_t01" } } },
	"s154": { "r": "ark", "d": "07a", "s": "6a", "fc": { "col": 0, "from": ["s153"], "graph": { "bg": "bg/bg_46b", "c": "tachi/his_t04" } } },
	"s155": { "r": "ark", "d": "07a", "s": "6b", "fc": { "col": 1, "from": ["s153"], "graph": { "bg": "bg/bg_40c" } } },
	"s156": { "r": "ark", "d": "07a", "s": "7", "fc": { "col": 0, "from": ["s154", "s155"], "graph": { "bg": "bg/bg_29c", "c": "tachi/ark_t06" } } },
	"s157": { "r": "ark", "d": "07a", "s": "8", "fc": { "col": 0, "from": ["s156"], "align": "s263", "graph": { "bg": "bg/bg_47", "c": "tachi/roa_t07a" } } },
	"s158": { "r": "ark", "d": "07a", "s": "8", "fc": { "col": 1, "from": ["s156"], "align": "s157", "graph": { "bg": "bg/bg_47", "c": "tachi/roa_t07b" } }, "deadEnd": true },
	"s515": { "r": "ark", "d": "07a", "s": "8", "osiete": true },
	"s159": { "r": "ark", "d": "08a", "s": "1", "fc": { "col": 0, "from": ["s157"], "graph": { "bg": "bg/bg_40c", "l": "tachi/his_t05", "r": "tachi/aki_t07b" } } },
	"s160": { "r": "ark", "d": "08a", "s": "2a", "fc": { "col": 0, "from": ["s159"], "graph": { "bg": "bg/bg_40c", "c": "tachi/aki_t04b" } } },
	"s161": { "r": "ark", "d": "08a", "s": "2b", "fc": { "col": 4, "from": ["s159"], "graph": { "bg": "bg/bg_29b", "c": "tachi/ark_t05b" } } },
	"s162": { "r": "ark", "d": "09a", "s": "1", "fc": { "col": 0, "from": ["s160"], "graph": { "bg": "event/ark_e04" } } },
	"s163": { "r": "ark", "d": "09a", "s": "2a", "fc": { "col": 0, "from": ["s162"], "graph": { "bg": "bg/bg_40a", "c": "tachi/ark_t11" } } },
	"s167": { "r": "ark", "d": "09a", "s": "2b", "fc": { "col": 3, "from": ["s162"], "graph": { "bg": "bg/bg_40a", "c": "tachi/ark_t04" } } },
	"s164": { "r": "ark", "d": "09a", "s": "3a", "fc": { "col": 0, "from": ["s163"], "graph": { "bg": "bg/bg_32a", "c": "tachi/ark_t08" } } },
	"s165": { "r": "ark", "d": "09a", "s": "3b", "fc": { "col": 1, "from": ["s163"], "graph": { "bg": "bg/bg_32a", "c": "tachi/ark_t14" } } },
	"s166": { "r": "ark", "d": "09a", "s": "3c", "fc": { "col": 2, "from": ["s163"], "graph": { "bg": "bg/bg_32a", "c": "tachi/ark_t16" } } },
	"s168": { "r": "ark", "d": "09a", "s": "4", "fc": { "col": 0, "from": ["s164", "s165", "s166"], "graph": { "bg": "bg/bg_32a", "c": "tachi/ark_t03" } } },
	"s169": { "r": "ark", "d": "09a", "s": "5a", "fc": { "col": 0, "from": ["s168"], "graph": { "bg": "bg/bg_25a", "c": "tachi/ark_t08" } } },
	"s170": { "r": "ark", "d": "09a", "s": "5b", "fc": { "col": 1, "from": ["s168"], "graph": { "bg": "bg/bg_31a", "c": "tachi/ark_t09" } } },
	"s171": { "r": "ark", "d": "09a", "s": "5c", "fc": { "col": 2, "from": ["s168"], "graph": { "bg": "bg/bg_29a", "c": "tachi/ark_t01a" } } },
	"s172": { "r": "ark", "d": "09a", "s": "6", "fc": { "col": 0, "from": ["s169", "s170", "s171"], "graph": { "bg": "bg/bg_56", "c": "tachi/ark_t09" } } },
	"s173": { "r": "ark", "d": "09a", "s": "7a", "fc": { "col": 0, "from": ["s172"], "graph": { "bg": "bg/bg_56", "c": "tachi/ark_t07" } } },
	"s174": { "r": "ark", "d": "09a", "s": "7b", "fc": { "col": 1, "from": ["s172"], "graph": { "bg": "bg/bg_56", "c": "tachi/ark_t10" } } },
	"s175": { "r": "ark", "d": "09a", "s": "7c", "fc": { "col": 2, "from": ["s172"], "graph": { "bg": "bg/bg_56", "c": "tachi/ark_t03" } } },
	"s176": { "r": "ark", "d": "09a", "s": "8", "fc": { "col": 0, "from": ["s173", "s174", "s175"], "graph": { "bg": "bg/bg_06f", "c": "tachi/ark_t17" }, "align": "s282" } },
	"s177": { "r": "ark", "d": "09a", "s": "9", "fc": { "col": 0, "from": ["s176"], "graph": { "bg": "bg/bg_28b", "c": "tachi/ark_t02" } } },
	"s178": { "r": "ark", "d": "09a", "s": "10", "fc": { "col": 0, "from": ["s177", "a176"], "graph": { "bg": "event/ark_e05a" } } },
	"s179": { "r": "ark", "d": "09a", "s": "11a", "fc": { "col": 0, "from": ["s178"], "graph": { "bg": "bg/bg_15b" } } },
	"s500": { "r": "ark", "d": "09a", "s": "11", "fc": { "col": 2, "from": ["s178"], "graph": { "bg": "bg/ima_12b" } }, "deadEnd": true },
	"s517": { "r": "ark", "d": "09a", "s": "11", "osiete": true },
	"s180": { "r": "ark", "d": "09a", "s": "11b", "fc": { "col": 1, "from": ["s178"], "graph": { "bg": "event/ark_h03" } }, "h": true },
	"s181": { "r": "ark", "d": "09a", "s": "12a", "fc": { "col": 1, "from": ["s180"], "graph": { "bg": "bg/bg_31b", "c": "tachi/ark_t10" } }, "h": true },
	"s182": { "r": "ark", "d": "09a", "s": "12b", "fc": { "col": 2, "from": ["s180"], "graph": { "bg": "event/ark_h04" } }, "h": true },
	"s183": { "r": "ark", "d": "10a", "s": "1", "fc": { "col": 0, "from": ["s181", "s182"], "graph": { "bg": "bg/bg_06a", "c": "tachi/ari_t03" } } },
	"s184": { "r": "ark", "d": "10a", "s": "2", "fc": { "col": 0, "from": ["s183"], "graph": { "bg": "bg/bg_29b" } } },
	"s185": { "r": "ark", "d": "10a", "s": "3", "fc": { "col": 0, "from": ["s184"], "graph": { "bg": "bg/bg_29b" } } },
	"s187": { "r": "ark", "d": "10a", "s": "4", "fc": { "col": 0, "from": ["s185"], "graph": { "bg": "bg/bg_29c", "c": "tachi/ark_t07" } } },
	"s188": { "r": "ark", "d": "10a", "s": "4", "fc": { "col": 1, "from": ["s187"], "graph": { "bg": "event/ark_e05b" } }, "deadEnd": true },
	"s519": { "r": "ark", "d": "10a", "s": "4", "osiete": true },
	"s189": { "r": "ark", "d": "10a", "s": "5", "fc": { "col": 0, "from": ["s187"], "graph": { "bg": "bg/bg_29b", "l": "tachi/cel_t06b", "r": "tachi/ark_t18" } } },
	"s190": { "r": "ark", "d": "10a", "s": "6a", "fc": { "col": 0, "from": ["s189"], "graph": { "bg": "bg/bg_31b" } } },
	"s191": { "r": "ark", "d": "10a", "s": "6b", "fc": { "col": 1, "from": ["s189"], "graph": { "bg": "bg/bg_29b" } } },
	"s192": { "r": "ark", "d": "10a", "s": "6c", "fc": { "col": 2, "from": ["s189"], "graph": { "bg": "bg/bg_15b" } } },
	"s193": { "r": "ark", "d": "10a", "s": "7", "fc": { "col": 0, "from": ["s190", "s191", "s192"], "graph": { "bg": "event/ark_h06" } }, "h": true },
	"s186": { "r": "ark", "d": "11b", "fc": { "col": 1, "from": ["b186*1", "b186*2", "s185"], "graph": { "bg": "bg/bg_01a", "c": "tachi/ari_t05" } }, "deadEnd": true },
	"s518": { "r": "ark", "d": "11b", "osiete": true },
	"s194": { "r": "ark", "d": "11a", "s": "1", "fc": { "col": 0, "from": ["s193"], "graph": { "bg": "bg/bg_08a" } } },
	"s195": { "r": "ark", "d": "11a", "s": "2a", "fc": { "col": 0, "from": ["s194"], "graph": { "bg": "bg/bg_08b" } } },
	"s196": { "r": "ark", "d": "11a", "s": "2b", "fc": { "col": 1, "from": ["s194"], "graph": { "bg": "bg/bg_08b" } } },
	"s197": { "r": "ark", "d": "11a", "s": "2c", "fc": { "col": 2, "from": ["s194"], "graph": { "bg": "bg/bg_08b" } } },
	"s198": { "r": "ark", "d": "11a", "s": "3", "fc": { "col": 0, "from": ["s195", "s196", "s197"], "graph": { "bg": "bg/bg_11d", "c": "tachi/roa_t07c" } } },
	"s199": { "r": "ark", "d": "12a", "fc": { "col": 0, "from": ["s198"], "graph": { "bg": "event/ark_e07" } } },
	"s52": { "r": "ark", "d": "13a", "s": "1", "fc": { "col": 0, "from": ["s199"], "graph": { "bg": "bg/ima_03" } } },
	"s53": { "r": "ark", "d": "13a", "s": "1", "//": "unused, identical to s52" },
	"s503": { "r": "ark", "d": "13a", "s": "1", "fc": { "col": 1, "from": ["s199"], "graph": { "bg": "bg/ima_03" } }, "//": "identical to s52" },
	"s52a": { "r": "ark", "d": "13a", "s": "2", "fc": { "col": 0, "from": ["s52", "a503"], "graph": { "bg": "event/ark_f02" } } },
	"s520": { "r": "ark", "d": "13a", "osiete": true },
	"s53a": { "r": "ark", "d": "13b", "fc": { "col": 1, "from": ["s503"], "graph": { "bg": "event/ark_f03" }, "align": "s52a" } },
	"s521": { "r": "ark", "d": "13b", "osiete": true },

	"s107": { "r": "cel", "d": "09b", "fc": { "col": 4, "from": ["s161"], "graph": { "bg": "bg/bg_34a", "l": "tachi/aki_t02", "r": "tachi/his_t08" } } },
	"s107a": { "r": "cel", "d": "09b", "fc": { "col": 3, "from": ["s107", "s167"], "graph": { "bg": "bg/bg_11c", "c": "tachi/roa_t04a" } }, "deadEnd": true },
	"s516": { "r": "cel", "d": "09b", "osiete": true },
	"s200": { "r": "cel", "d": "05a", "s": "1", "fc": { "col": 6, "from": ["s106"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t01" } } },
	"s219": { "r": "cel", "d": "05a", "s": "2a", "fc": { "col": 6, "from": ["s200"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t01a" } } },
	"s220": { "r": "cel", "d": "05a", "s": "2b", "fc": { "col": 7, "from": ["s200"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t15a" } } },
	"s221": { "r": "cel", "d": "05a", "s": "2c", "fc": { "col": 8, "from": ["s200"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t10" } } },
	"s222": { "r": "cel", "d": "05a", "s": "3", "fc": { "col": 6, "from": ["s219", "s220", "s221"], "graph": { "bg": "bg/bg_34a", "l": "tachi/aki_t13a", "r": "tachi/koha_t01a" } } },
	"s223": { "r": "cel", "d": "05a", "s": "4a", "fc": { "col": 6, "from": ["s222"], "graph": { "bg": "bg/bg_03a", "c": "tachi/cel_t08" } } },
	"s224": { "r": "cel", "d": "05a", "s": "4b", "fc": { "col": 7, "from": ["s222"], "graph": { "bg": "bg/bg_03a", "c": "tachi/cel_t10a" } } },
	"s225": { "r": "cel", "d": "05a", "s": "5", "fc": { "col": 6, "from": ["s223", "s224"], "graph": { "bg": "bg/bg_06a", "c": "tachi/ari_t03" } } },
	"s226": { "r": "cel", "d": "05a", "s": "6a", "fc": { "col": 6, "from": ["s225"], "graph": { "bg": "bg/bg_06a", "r": "tachi/cel_t08", "l": "tachi/ari_t02" } } },
	"s227": { "r": "cel", "d": "05a", "s": "6b", "fc": { "col": 7, "from": ["s225"], "graph": { "bg": "bg/bg_06a", "r": "tachi/cel_t11", "l": "tachi/ari_t01" } } },
	"s228": { "r": "cel", "d": "05a", "s": "7", "fc": { "col": 6, "from": ["s226", "s227"], "graph": { "bg": "bg/bg_06a", "r": "tachi/cel_t08", "l": "tachi/ari_t02" } } },
	"s229": { "r": "cel", "d": "05a", "s": "8a", "fc": { "col": 6, "from": ["s228"], "graph": { "bg": "bg/bg_01b", "c": "tachi/cel_t04" } } },
	"s230": { "r": "cel", "d": "05a", "s": "8b", "fc": { "col": 7, "from": ["s228"], "graph": { "bg": "bg/bg_11b", "c": "tachi/cel_t02" } } },
	"s231": { "r": "cel", "d": "05a", "s": "9a", "fc": { "col": 7, "from": ["s230"], "graph": { "bg": "bg/bg_01b", "c": "tachi/cel_t04" } } },
	"s232": { "r": "cel", "d": "05a", "s": "9b", "fc": { "col": 8, "from": ["s230"], "graph": { "bg": "event/cel_e02b" } } },
	"s233": { "r": "cel", "d": "05a", "s": "10", "fc": { "col": 6, "from": ["s229", "s231", "s232"], "graph": { "bg": "bg/bg_32b", "c": "tachi/his_t01" } } },
	"s244": { "r": "cel", "d": "06a", "s": "5", "fc": { "col": 6, "from": ["b135"], "graph": { "bg": "bg/bg_06a", "c": "tachi/ari_t05" } } },
	"s245": { "r": "cel", "d": "06a", "s": "6a", "fc": { "col": 6, "from": ["s244"], "graph": { "bg": "bg/bg_50", "c": "tachi/ari_t04" } } },
	"s246": { "r": "cel", "d": "06a", "s": "6b", "fc": { "col": 7, "from": ["s244"], "graph": { "bg": "bg/bg_11a" } } },
	"s247": { "r": "cel", "d": "06a", "s": "7a", "fc": { "col": 7, "from": ["s246"], "graph": { "bg": "bg/bg_11a" } } },
	"s248": { "r": "cel", "d": "06a", "s": "7b", "fc": { "col": 8, "from": ["s246"], "graph": { "bg": "bg/bg_09a", "c": "tachi/cel_t04" } } },
	"s249": { "r": "cel", "d": "06a", "s": "8", "fc": { "col": 6, "from": ["s245", "s247", "s248"], "graph": { "bg": "bg/bg_06b" } } },
	"s250": { "r": "cel", "d": "06a", "s": "9a", "fc": { "col": 6, "from": ["s249"], "graph": { "bg": "bg/bg_06b" } } },
	"s251": { "r": "cel", "d": "06a", "s": "9b", "fc": { "col": 7, "from": ["s249"], "graph": { "bg": "bg/bg_01b", "c": "tachi/cel_t01a" } } },
	"s252": { "r": "cel", "d": "06a", "s": "9c", "fc": { "col": 8, "from": ["s249"], "graph": { "bg": "bg/bg_25a" } } },
	"s253": { "r": "cel", "d": "06a", "s": "10", "fc": { "col": 6, "from": ["s250", "s251", "s252"], "graph": { "bg": "bg/bg_34b", "l": "tachi/koha_t03", "r": "tachi/aki_t04b" } } },
	"s254": { "r": "cel", "d": "06a", "s": "11a", "fc": { "col": 6, "from": ["s253"], "graph": { "bg": "bg/bg_29b", "c": "tachi/ark_t13", "monochrome": "#0f00f0" } } },
	"s255": { "r": "cel", "d": "06a", "s": "11b", "fc": { "col": 7, "from": ["s253"], "graph": { "bg": "bg/bg_29b", "c": "tachi/ark_t16", "monochrome": "#0f00f0" } } },
	"s256": { "r": "cel", "d": "06a", "s": "12", "fc": { "col": 6, "from": ["s254", "s255"], "graph": { "bg": "bg/bg_29b", "c": "tachi/ark_t07" } } },
	"s257": { "r": "cel", "d": "06a", "s": "13a", "fc": { "col": 6, "from": ["s256"], "graph": { "bg": "bg/bg_29b", "c": "tachi/ark_t04" } } },
	"s258": { "r": "cel", "d": "06a", "s": "13b", "fc": { "col": 7, "from": ["s256"], "graph": { "bg": "bg/bg_29b", "c": "tachi/ark_t16" } } },
	"s259": { "r": "cel", "d": "06a", "s": "14", "fc": { "col": 6, "from": ["s257", "s258"], "graph": { "bg": "bg/bg_52", "c": "tachi/ark_t22" } } },
	"s260": { "r": "cel", "d": "07a", "s": "1", "fc": { "col": 6, "from": ["s259"], "graph": { "bg": "event/cel_e03a" } } },
	"s261": { "r": "cel", "d": "07a", "s": "2a", "fc": { "col": 6, "from": ["s260"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t03a" } } },
	"s262": { "r": "cel", "d": "07a", "s": "2b", "fc": { "col": 7, "from": ["s260"], "graph": { "bg": "bg/bg_05a", "c": "tachi/cel_t07a" } } },
	"s263": { "r": "cel", "d": "07a", "s": "3a", "fc": { "col": 6, "from": ["b263"], "graph": { "bg": "bg/bg_05a" } } },
	"s264": { "r": "cel", "d": "07a", "s": "3b", "fc": { "col": 7, "from": ["b263"], "graph": { "bg": "bg/bg_05a", "c": "tachi/cel_t09" } } },
	"s265": { "r": "cel", "d": "07a", "s": "3c", "fc": { "col": 8, "from": ["b263"], "graph": { "bg": "bg/bg_05a", "c": "tachi/cel_t04" } } },
	"s266": { "r": "cel", "d": "07a", "s": "3d", "fc": { "col": 9, "from": ["b263"], "graph": { "bg": "bg/bg_05a", "c": "tachi/cel_t12" } } },
	"s267": { "r": "cel", "d": "07a", "s": "4", "fc": { "col": 6, "from": ["s263", "s264", "s265", "s266"], "graph": { "bg": "bg/bg_05a", "c": "tachi/cel_t08" } } },
	"s268": { "r": "cel", "d": "07a", "s": "5a", "fc": { "col": 6, "from": ["s267"], "graph": { "bg": "bg/bg_27b", "c": "tachi/cel_t07b" } } },
	"s269": { "r": "cel", "d": "07a", "s": "5b", "fc": { "col": 7, "from": ["s267"], "graph": { "bg": "bg/bg_27b", "c": "tachi/cel_t01b" } } },
	"s270": { "r": "cel", "d": "07a", "s": "6", "fc": { "col": 6, "from": ["s268", "s269"], "graph": { "bg": "bg/bg_25b", "l": "tachi/ark_t05b", "r": "tachi/cel_t07b" } } },
	"s271": { "r": "cel", "d": "08a", "fc": { "col": 6, "from": ["s270"], "graph": { "bg": "event/cel_e05a" } }, "//": "day=8 inside scene" },
	"s273": { "r": "cel", "d": "09a", "s": "1", "fc": { "col": 6, "from": ["s271"], "graph": { "bg": "bg/bg_34a", "c": "tachi/aki_t17a" } } },
	"s274": { "r": "cel", "d": "09a", "s": "2a", "fc": { "col": 6, "from": ["s273"], "graph": { "bg": "bg/bg_01a" } } },
	"s275": { "r": "cel", "d": "09a", "s": "2b", "fc": { "col": 7, "from": ["s273"], "graph": { "bg": "bg/bg_01a" } } },
	"s276": { "r": "cel", "d": "09a", "s": "2c", "fc": { "col": 8, "from": ["s273"], "graph": { "bg": "bg/bg_05a" } } },
	"s277": { "r": "cel", "d": "09a", "s": "3", "fc": { "col": 6, "from": ["s274", "s275", "s276"], "graph": { "bg": "bg/bg_06a", "c": "tachi/ari_t03" } } },
	"s278": { "r": "cel", "d": "09a", "s": "4a", "fc": { "col": 6, "from": ["s277"], "graph": { "bg": "bg/bg_09b", "monochrome": "#ff0000" } } },
	"s279": { "r": "cel", "d": "09a", "s": "4b", "fc": { "col": 7, "from": ["s277"], "graph": { "bg": "bg/bg_50", "c": "tachi/cel_t01a" } } },
	"s280": { "r": "cel", "d": "09a", "s": "5a", "fc": { "col": 7, "from": ["s279"], "graph": { "bg": "bg/bg_09b", "monochrome": "#ff0000" } } },
	"s281": { "r": "cel", "d": "09a", "s": "5b", "fc": { "col": 8, "from": ["s279"], "graph": { "bg": "bg/bg_05a", "c": "tachi/cel_t10a" } } },
	"s282": { "r": "cel", "d": "09a", "s": "6", "fc": { "col": 6, "from": ["s278", "s280", "a281"], "graph": { "bg": "bg/bg_09c", "c": "tachi/roa_t04a" } }, "deadEnd": true },
	"s522": { "r": "cel", "d": "09a", "s": "6", "osiete": true },
	"s283": { "r": "cel", "d": "09a", "s": "6", "fc": { "col": 8, "from": ["s281"], "align": "s282", "graph": { "bg": "event/cel_e09" } } },
	"s510": { "r": "cel", "d": "09b", "fc": { "col": 0, "from": ["s179"], "graph": { "bg": "bg/bg_11c", "c": "tachi/roa_t07b" } }, "deadEnd": true },
	"s284": { "r": "cel", "d": "10a", "s": "1", "fc": { "col": 6, "from": ["s283"], "graph": { "bg": "bg/bg_06a", "l": "tachi/ari_t03", "r": "tachi/cel_t01a" } } },
	"s285": { "r": "cel", "d": "10a", "s": "2a", "fc": { "col": 6, "from": ["s284"], "graph": { "bg": "bg/bg_25a", "c": "tachi/cel_t01c" } } },
	"s286": { "r": "cel", "d": "10a", "s": "2b", "fc": { "col": 7, "from": ["s284"], "graph": { "bg": "bg/bg_33a", "l": "tachi/koha_t05", "r": "tachi/his_t23" } } },
	"s287": { "r": "cel", "d": "10a", "s": "3", "fc": { "col": 6, "from": ["s285", "s286"], "graph": { "bg": "bg/bg_25b" } } },
	"s288": { "r": "cel", "d": "11a", "s": "1", "fc": { "col": 6, "from": ["s287"], "graph": { "bg": "bg/bg_40e", "monochrome": "#fffff0" } } },
	"s289": { "r": "cel", "d": "11b", "s": "1", "fc": { "col": 6, "from": ["s288"], "graph": { "bg": "bg/bg_40f", "c": "tachi/koha_t02" } } },
	"s289a": { "r": "cel", "d": "11b", "fc": { "col": 6, "from": ["s289", "s296"], "graph": { "bg": "event/cel_e06b" } }, "deadEnd": true },
	"s523": { "r": "cel", "d": "11b", "osiete": true },
	"s292": { "r": "cel", "d": "11a", "s": "2", "fc": { "col": 7, "from": ["s288"], "graph": { "bg": "bg/bg_40f" } } },
	"s293": { "r": "cel", "d": "11a", "s": "3a", "fc": { "col": 7, "from": ["s292"], "graph": { "bg": "bg/ima_13" } } },
	"s294": { "r": "cel", "d": "11a", "s": "3b", "fc": { "col": 8, "from": ["s292"], "graph": { "bg": "event/cel_h10" } }, "h": true },
	"s295": { "r": "cel", "d": "11a", "s": "4", "fc": { "col": 7, "from": ["s293", "s294"], "graph": { "bg": "bg/bg_27b" } } },
	"s296": { "r": "cel", "d": "11a", "s": "5a", "fc": { "col": 7, "from": ["s295"], "graph": { "bg": "bg/bg_27b" } } },
	"s297": { "r": "cel", "d": "11a", "s": "5b", "fc": { "col": 8, "from": ["s295"], "graph": { "bg": "bg/bg_02a", "c": "tachi/cel_t15" } } },
	"s298": { "r": "cel", "d": "11a", "s": "6", "fc": { "col": 9, "from": ["s297"], "graph": { "bg": "bg/bg_03c", "c": "tachi/cel_t06c" } }, "deadEnd": true },
	"s524": { "r": "cel", "d": "11a", "s": "6", "osiete": true },
	"s299": { "r": "cel", "d": "11a", "s": "6", "fc": { "col": 8, "from": ["s297"], "graph": { "bg": "bg/bg_02a", "c": "tachi/cel_t06c" } } },
	"s300": { "r": "cel", "d": "11a", "s": "7a", "fc": { "col": 6, "from": ["s299"], "graph": { "bg": "bg/bg_11c" } } },
	"s301": { "r": "cel", "d": "11a", "s": "7", "fc": { "col": 6, "from": ["a299", "s300"], "graph": { "bg": "bg/bg_11d", "c": "tachi/cel_t15" } }, "deadEnd": true },
	"s525": { "r": "cel", "d": "11a", "s": "7", "osiete": true },
	"s302": { "r": "cel", "d": "11a", "s": "7b", "fc": { "col": 8, "from": ["s299"], "align": "s301", "graph": { "bg": "event/cel_e07a" } } },
	"s504": { "r": "cel", "d": "11a", "s": "8a", "fc": { "col": 6, "from": ["s302"], "graph": { "bg": "event/cel_h09a" } }, "h": true },
	"s505": { "r": "cel", "d": "11a", "s": "8b", "fc": { "col": 7, "from": ["s302"], "graph": { "bg": "event/cel_h09b" } }, "h": true },
	"s307": { "r": "cel", "d": "12a", "fc": { "col": 6, "from": ["s504", "s505"], "graph": { "bg": "event/ark_e06a" } } },
	"s308": { "r": "cel", "d": "13b", "fc": { "col": 6, "from": ["s307"], "graph": { "bg": "bg/bg_22a", "l": "tachi/ark_t01a", "r": "tachi/cel_t10d" } }, "//": "day=13 inside scene" },
	"s526": { "r": "cel", "d": "13b", "osiete": true },
	"s310": { "r": "cel", "d": "13a", "fc": { "col": 7, "from": ["s307"], "graph": { "bg": "event/cel_f02" } }, "//": "day=13 inside scene" },
	"s527": { "r": "cel", "d": "13b", "osiete": true },

	"s234": { "r": "aki", "d": "03b", "fc": { "col": 12, "from": ["s211"], "graph": { "bg": "bg/bg_06c", "c": "tachi/stk_t10" } }, "deadEnd": true },
	"s532": { "r": "aki", "d": "03b", "osiete": true },
	"s235": { "r": "aki", "d": "03a", "s": "1a", "fc": { "col": 10, "from": ["s217"] } },
	"s236": { "r": "aki", "d": "03a", "s": "1b", "fc": { "col": 10, "from": ["s218"], "graph": { "bg": "bg/bg_46c", "c": "tachi/his_t23" } } },
	"s237": { "r": "aki", "d": "03a", "s": "2a", "fc": { "col": 11, "from": ["s235"], "graph": { "bg": "bg/bg_23b" } } },
	"s238": { "r": "aki", "d": "03a", "s": "2b", "fc": { "col": 12, "from": ["s235"], "graph": { "bg": "bg/bg_01b" } } },
	"s239": { "r": "aki", "d": "03a", "s": "2c", "fc": { "col": 13, "from": ["s235"], "graph": { "bg": "bg/bg_23b" } } },
	"s240": { "r": "aki", "d": "03a", "s": "3", "fc": { "col": 11, "from": ["s237", "s238", "s239"], "graph": { "bg": "bg/bg_40c" } } },
	"s241": { "r": "aki", "d": "03a", "s": "4a", "fc": { "col": 11, "from": ["s240"], "graph": { "bg": "bg/bg_29b", "c": "tachi/stk_t04" } } },
	"s242": { "r": "aki", "d": "03a", "s": "4b", "fc": { "col": 12, "from": ["s240"], "graph": { "bg": "bg/bg_29b", "c": "tachi/stk_t10" } } },
	"s243": { "r": "aki", "d": "03a", "s": "5a", "fc": { "col": 10, "from": ["a242"], "graph": { "bg": "bg/bg_29b", "c": "tachi/stk_t09" } } },
	"s290": { "r": "aki", "d": "03a", "s": "5b", "fc": { "col": 11, "from": ["a242"], "graph": { "bg": "bg/bg_29b", "c": "tachi/stk_t08" } } },
	"s291": { "r": "aki", "d": "03a", "s": "5c", "fc": { "col": 12, "from": ["a242"], "graph": { "bg": "bg/bg_29b", "c": "tachi/stk_t10" } } },
	"s312": { "r": "aki", "d": "03a", "s": "6a", "fc": { "col": 10, "from": ["a291"], "graph": { "bg": "event/stk_e02" } } },
	"s313": { "r": "aki", "d": "03a", "s": "6b", "fc": { "col": 12, "from": ["a291"], "graph": { "bg": "bg/bg_29b", "c": "tachi/stk_t02" } } },
	"s314": { "r": "aki", "d": "03a", "s": "7", "fc": { "col": 11, "from": ["s312"], "graph": { "bg": "event/stk_e01a" } }, "deadEnd": true },
	"s533": { "r": "aki", "d": "03a", "s": "7", "osiete": true },
	"s312a": { "r": "aki", "d": "03a", "s": "7", "fc": { "col": 10, "from": ["s312"], "graph": { "bg": "event/stk_e01b" } } },
	"s305": { "r": "aki", "d": "04a", "s": "1", "fc": { "col": 10, "from": ["s312a"], "graph": { "bg": "bg/bg_40a", "l": "tachi/his_t01", "r": "tachi/aki_t21b" } } },
	"s317": { "r": { "flg": "P", "0": "his", "1": "aki" }, "d": "04a", "s": "2", "fc": { "col": 11, "from": ["a305", "s306"], "graph": { "bg": "bg/bg_34a", "l": "tachi/koha_t03b", "r": "tachi/his_t02" } } },
	"s320": { "r": "aki", "d": "04a", "s": "3", "fc": { "col": 11, "from": ["s317"] } },
	"s321": { "r": { "flg": "P", "0": "his", "1": "aki" }, "d": "04a", "s": "4", "fc": { "col": 11, "from": ["s320", "s318", "s319"], "graph": { "bg": "bg/bg_34a", "l": "tachi/koha_t01a", "c": "tachi/aki_t08b", "r": "tachi/his_t20" } } },
	"s322": { "r": "aki", "d": "04a", "s": "5", "fc": { "col": 11, "from": ["s321"], "graph": { "bg": "bg/bg_34c", "c": "tachi/aki_t26" } } },
	"s325": { "r": "aki", "d": "05a", "s": "1a", "fc": { "col": 11, "from": ["s322"], "graph": { "bg": "bg/bg_04", "l": "tachi/aki_t12a", "r": "tachi/ari_t05" } } },
	"s303": { "r": "aki", "d": "05a", "s": "1b", "fc": { "col": 10, "from": ["s305"], "align": "s325", "graph": { "bg": "bg/bg_40c", "c": "tachi/aki_t13b" } }, "//": "day=5 inside scene" },
	"s326": { "r": "aki", "d": "05a", "s": "2a", "fc": { "col": 10, "from": ["a303"], "graph": { "bg": "bg/bg_04", "c": "tachi/aki_t05a" } } },
	"s327": { "r": "aki", "d": "05a", "s": "2b", "fc": { "col": 11, "from": ["a303"], "graph": { "bg": "bg/bg_04", "c": "tachi/aki_t03a" } } },
	"s328": { "r": "aki", "d": "05a", "s": "2c", "fc": { "col": 12, "from": ["a303"], "graph": { "bg": "bg/bg_04", "c": "tachi/aki_t21" } } },
	"s329": { "r": "aki", "d": "05a", "s": "3", "fc": { "col": 10, "from": ["s326", "s327", "s328"], "graph": { "bg": "bg/bg_04", "l": "tachi/ari_t01", "r": "tachi/aki_t13a" } } },
	"s331": { "r": "aki", "d": "05a", "s": "4a", "fc": { "col": 10, "from": ["s329"] } },
	"s330": { "r": "aki", "d": "05a", "s": "4b", "fc": { "col": 11, "from": ["s329"] } },
	"s332": { "r": "aki", "d": "05a", "s": "5a", "fc": { "col": 10, "from": ["s329"], "graph": { "bg": "bg/bg_23b", "c": "tachi/aki_t21" } } },
	"s333": { "r": "aki", "d": "05a", "s": "5b", "fc": { "col": 11, "from": ["s329"], "graph": { "bg": "bg/bg_32b", "c": "tachi/aki_t01a" } } },
	"s334": { "r": "aki", "d": "05a", "s": "6", "fc": { "col": 10, "from": ["s332", "s333"], "graph": { "bg": "bg/bg_40b" } } },
	"s335": { "r": "aki", "d": "05a", "s": "7a", "fc": { "col": 10, "from": ["s334"], "graph": { "bg": "bg/bg_34c", "l": "tachi/his_t01", "r": "tachi/koha_t04b" } } },
	"s336": { "r": "aki", "d": "05a", "s": "7b", "fc": { "col": 11, "from": ["s334"], "graph": { "bg": "bg/bg_45c", "c": "tachi/koha_t04b" } } },
	"s337": { "r": "aki", "d": "05a", "s": "7c", "fc": { "col": 12, "from": ["s334"], "graph": { "bg": "bg/bg_40b" } } },
	"s338": { "r": "aki", "d": "05a", "s": "8", "fc": { "col": 10, "from": ["s335", "s336", "s337"], "graph": { "bg": "bg/bg_33c", "c": "tachi/aki_t20b", "r": "tachi/koha_t02" } } },
	"s339": { "r": "aki", "d": "05a", "s": "9a", "fc": { "col": 10, "from": ["s338"], "graph": { "bg": "bg/ima_18", "monochrome": "#ff0000" } } },
	"s340": { "r": "aki", "d": "05a", "s": "9b", "fc": { "col": 11, "from": ["s338"], "graph": { "bg": "bg/bg_25b", "monochrome": "#ff0000" } } },
	"s341": { "r": "aki", "d": "05a", "s": "9c", "fc": { "col": 12, "from": ["s338"], "graph": { "bg": "bg/bg_31b", "monochrome": "#ff0000" } } },
	"s342": { "r": "aki", "d": "05a", "s": "9d", "fc": { "col": 13, "from": ["s338"], "graph": { "bg": "bg/ima_18", "monochrome": "#ff0000" } } },
	"s343": { "r": "aki", "d": "06a", "s": "1", "fc": { "col": 10, "from": ["s339", "s340", "s341", "s342"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t07" } } },
	"s344": { "r": "aki", "d": "06a", "s": "2a", "fc": { "col": 10, "from": ["s343"], "graph": { "bg": "bg/bg_01a", "c": "tachi/aki_t04a" } } },
	"s345": { "r": "aki", "d": "06a", "s": "2b", "fc": { "col": 11, "from": ["s343"], "graph": { "bg": "bg/bg_03a", "c": "tachi/aki_t12a" } } },
	"s346": { "r": "aki", "d": "06a", "s": "2c", "fc": { "col": 12, "from": ["s343"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t09" } } },
	"s347": { "r": "aki", "d": "06a", "s": "3", "fc": { "col": 10, "from": ["s344", "s345", "s346"], "graph": { "bg": "bg/bg_04", "l": "tachi/aki_t15a", "c": "tachi/ari_t03", "r": "tachi/cel_t03" } } },
	"s348": { "r": "aki", "d": "06a", "s": "4a", "fc": { "col": 10, "from": ["s347"], "graph": { "bg": "bg/bg_04", "l": "tachi/aki_t16a", "r": "tachi/ari_t01" } } },
	"s349": { "r": "aki", "d": "06a", "s": "4b", "fc": { "col": 11, "from": ["s347"], "graph": { "bg": "bg/bg_04", "l": "tachi/cel_t04", "r": "tachi/ari_t01" } } },
	"s350": { "r": "aki", "d": "06a", "s": "5", "fc": { "col": 10, "from": ["s348", "s349"], "graph": { "bg": "bg/bg_23b", "c": "tachi/aki_t21" } } },
	"s351": { "r": "aki", "d": "06a", "s": "6a", "fc": { "col": 10, "from": ["s350"], "graph": { "bg": "bg/bg_41", "c": "tachi/his_t25" } }, "//": "day=7 near the end" },
	"s352": { "r": "aki", "d": "06a", "s": "6b", "fc": { "col": 11, "from": ["s350"], "graph": { "bg": "bg/bg_45b", "c": "tachi/koha_t03" } }, "//": "day=7 near the end" },
	"s353": { "r": "aki", "d": "07a", "s": "1", "fc": { "col": 10, "from": ["s351", "s352"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t17" } } },
	"s354": { "r": "aki", "d": "07a", "s": "2a", "fc": { "col": 10, "from": ["s353"], "graph": { "bg": "bg/bg_34a", "l": "tachi/aki_t14", "r": "tachi/koha_t04" } } },
	"s355": { "r": "aki", "d": "07a", "s": "2b", "fc": { "col": 11, "from": ["s353"], "graph": { "bg": "bg/bg_34a", "c": "tachi/koha_t04" } } },
	"s356": { "r": "aki", "d": "07a", "s": "3a", "fc": { "col": 10, "from": ["a354"], "graph": { "bg": "bg/bg_11a", "c": "tachi/aki_t13a" } } },
	"s357": { "r": "aki", "d": "07a", "s": "3b", "fc": { "col": 11, "from": ["a354"], "graph": { "bg": "bg/bg_04", "c": "tachi/aki_t04a" } } },
	"s358": { "r": "aki", "d": "07a", "s": "4", "fc": { "col": 10, "from": ["s356", "s357"], "graph": { "bg": "bg/bg_04", "l": "tachi/cel_t04", "r": "tachi/aki_t01a" } } },
	"s359": { "r": "aki", "d": "07a", "s": "5", "fc": { "col": 10, "from": ["s358"], "graph": { "bg": "bg/cmo_06b" } } },
	"s360": { "r": "aki", "d": "07a", "s": "5", "fc": { "col": 11, "from": ["s358"], "graph": { "bg": "bg/ima_12b" } }, "deadEnd": true },
	"s534": { "r": "aki", "d": "07a", "s": "5", "osiete": true },
	"s361": { "r": "aki", "d": "08a", "fc": { "col": 10, "from": ["s359"], "graph": { "bg": "event/aki_e03" } }, "h": true, "//": "day=9 inside scene" },
	"s364": { "r": "aki", "d": "09a", "s": "2", "fc": { "col": 11, "from": ["s361"], "graph": { "bg": "bg/bg_31b", "monochrome": "#ff0000" } }, "deadEnd": true },
	"s535": { "r": "aki", "d": "09a", "s": "2", "osiete": true },
	"s362": { "r": "aki", "d": "09a", "s": "2", "fc": { "col": 10, "from": ["s361"], "graph": { "bg": "bg/bg_10f", "c": "tachi/man_t03" } } },
	"s501": { "r": "aki", "d": "09a", "s": "3", "fc": { "col": 10, "from": ["s362"], "graph": { "bg": "bg/ima_18", "monochrome": "#ff0000" } }, "deadEnd": true },
	"s536": { "r": "aki", "d": "09a", "s": "3", "osiete": true },
	"s363": { "r": "aki", "d": "09a", "s": "3", "fc": { "col": 11, "from": ["s362"], "graph": { "bg": "event/aki_e05b" } } },
	"s365": { "r": "aki", "d": "10a", "s": "1", "fc": { "col": 10, "from": ["s363"], "graph": { "bg": "event/aki_e08" } } },
	"s366": { "r": "aki", "d": "10a", "s": "2a", "fc": { "col": 10, "from": ["s365"], "graph": { "bg": "bg/bg_34b", "monochrome": "#0f00f0" } } },
	"s367": { "r": "aki", "d": "10a", "s": "2b", "fc": { "col": 11, "from": ["s365"], "graph": { "bg": "bg/bg_39", "monochrome": "#0f00f0" } } },
	"s368": { "r": "aki", "d": "10a", "s": "2c", "fc": { "col": 12, "from": ["s365"], "graph": { "bg": "bg/bg_33d", "monochrome": "#0f00f0" } } },
	"s369": { "r": "aki", "d": "10a", "s": "2d", "fc": { "col": 13, "from": ["s365"], "graph": { "bg": "bg/bg_40d", "monochrome": "#0f00f0" } } },
	"s370": { "r": "aki", "d": "10a", "s": "3", "fc": { "col": 10, "from": ["s366", "s367", "s368", "s369"], "graph": { "bg": "bg/bg_36d", "c": "tachi/hal_t01" } } },
	"s371": { "r": "aki", "d": "10a", "s": "4a", "fc": { "col": 10, "from": ["s370"], "graph": { "bg": "bg/cmo_18" } } },
	"s372": { "r": "aki", "d": "10a", "s": "4b", "fc": { "col": 11, "from": ["s370"], "graph": { "bg": "bg/ima_14" } } },
	"s373": { "r": "aki", "d": "10a", "s": "5", "fc": { "col": 10, "from": ["s371", "s372"], "graph": { "bg": "event/aki_e04b" } } },
	"s374": { "r": "aki", "d": "11a", "fc": { "col": 10, "from": ["s373"], "graph": { "bg": "event/aki_h01" } }, "h": true },
	"s375": { "r": "aki", "d": "12a", "s": "1", "fc": { "col": 10, "from": ["s374"], "graph": { "bg": "bg/bg_18b", "c": "tachi/cel_t07a" } } },
	"s376": { "r": "aki", "d": "12a", "s": "2", "fc": { "col": 10, "from": ["s375"], "graph": { "bg": "bg/ima_13b" } }, "deadEnd": true },
	"s537": { "r": "aki", "d": "12a", "s": "2", "osiete": true },
	"s378": { "r": "aki", "d": "12a", "s": "2", "fc": { "col": 11, "from": ["s375"], "graph": { "bg": "bg/bg_53b" } } },
	"s379": { "r": "aki", "d": "12a", "s": "3", "fc": { "col": 11, "from": ["s378"], "graph": { "bg": "bg/ima_13" } }, "deadEnd": true },
	"s538": { "r": "aki", "d": "12a", "s": "3", "osiete": true },
	"s380": { "r": "aki", "d": "12a", "s": "3", "fc": { "col": 10, "from": ["s378"], "graph": { "bg": "bg/bg_53b", "c": "tachi/hal_t03" } } },
	"s509": { "r": "aki", "d": "13b", "s": "1", "fc": { "col": 11, "from": ["s380"], "graph": { "bg": "bg/bg_54a", "c": "tachi/his_t01" } }, "deadEnd": true },
	"s539": { "r": "aki", "d": "13b", "s": "1", "osiete": true },
	"s381": { "r": "aki", "d": "12a", "s": "4", "fc": { "col": 10, "from": ["s380"], "graph": { "bg": "event/aki_e06" } } },
	"s382": { "r": "aki", "d": "12a", "s": "5", "fc": { "col": 10, "from": ["s381"], "graph": { "bg": "bg/ima_01" } }, "deadEnd": true },
	"s540": { "r": "aki", "d": "12a", "s": "5", "osiete": true },
	"s383": { "r": "aki", "d": "12a", "s": "5", "fc": { "col": 11, "from": ["s381"], "graph": { "bg": "bg/bg_54a" } } },
	"s385": { "r": "aki", "d": "13a", "fc": { "col": 10, "from": ["s383"], "graph": { "bg": "event/aki_f02" } } },
	"s541": { "r": "aki", "d": "13a", "osiete": true },
	"s384": { "r": "aki", "d": "13b", "fc": { "col": 11, "from": ["s383"], "graph": { "bg": "bg/ima_03" } } },
	"s542": { "r": "aki", "d": "13b", "osiete": true },

	"s315": { "r": "his", "d": "04a", "s": "1a", "fc": { "col": 12, "from": ["s313"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t03" } }, "//": "day=4 inside scene" },
	"s316": { "r": "his", "d": "04a", "s": "1b", "fc": { "col": 13, "from": ["s313"], "graph": { "bg": "bg/bg_33d", "c": "tachi/aki_t03b" } }, "//": "day=4 inside scene" },
	"s306": { "r": "his", "d": "04a", "s": "2", "fc": { "col": 11, "from": ["s315", "s316"], "graph": { "bg": "bg/bg_34a", "l": "tachi/his_t01", "r": "tachi/aki_t15b" } } },
	"s318": { "r": "his", "d": "04a", "s": "3a", "fc": { "col": 11, "from": ["s317"], "graph": { "bg": "bg/bg_35", "c": "tachi/koha_t07" } } },
	"s319": { "r": "his", "d": "04a", "s": "3b", "fc": { "col": 12, "from": ["s317"], "graph": { "bg": "bg/bg_34a", "c": "tachi/his_t13" } } },
	"s414": { "r": "his", "d": "05a", "s": "1a", "fc": { "col": 14, "from": ["b414"], "align": "s323", "cutAt": 1, "graph": { "bg": "bg/bg_40c", "c": "tachi/aki_t01b" } } },
	"s323": { "r": "his", "d": "05a", "s": "1b", "fc": { "col": 15, "from": ["s321"], "graph": { "bg": "bg/bg_34b", "c": "tachi/his_t11" } } },
	"s324": { "r": "his", "d": "05a", "s": "1c", "fc": { "col": 17, "from": ["s321"], "graph": { "bg": "bg/bg_34c", "l": "tachi/koha_t02b", "r": "tachi/aki_t13b" } } },
	"s386": { "r": "his", "d": "05a", "s": "2", "fc": { "col": 14, "from": ["s323", "s414"], "graph": { "bg": "bg/bg_33b", "c": "tachi/his_t16" } } },
	"s387": { "r": "his", "d": "05a", "s": "3a", "fc": { "col": 14, "from": ["s386"], "graph": { "bg": "bg/bg_41", "c": "tachi/his_t17" } } },
	"s388": { "r": "his", "d": "05a", "s": "3b", "fc": { "col": 15, "from": ["s386"], "graph": { "bg": "bg/bg_42b", "c": "tachi/koha_t06" } } },
	"s389": { "r": "his", "d": "05a", "s": "3c", "fc": { "col": 16, "from": ["s386"], "graph": { "bg": "bg/bg_36c", "c": "tachi/aki_t18a" } } },
	"s390": { "r": "his", "d": "05a", "s": "4", "fc": { "col": 14, "from": ["s387", "s388", "s389"], "graph": { "bg": "bg/bg_26a" } } },
	"s391": { "r": "his", "d": "06a", "s": "1", "fc": { "col": 14, "from": ["s390"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t04" } } },
	"s392": { "r": "his", "d": "06a", "s": "2a", "fc": { "col": 14, "from": ["s391"], "graph": { "bg": "bg/bg_32a", "c": "tachi/his_t17" } } },
	"s393": { "r": "his", "d": "06a", "s": "2b", "fc": { "col": 15, "from": ["s391"], "graph": { "bg": "bg/bg_30a" } } },
	"s394": { "r": "his", "d": "06a", "s": "3", "fc": { "col": 14, "from": ["s392"], "graph": { "bg": "bg/bg_33a" } } },
	"s395": { "r": "his", "d": "06a", "s": "4", "fc": { "col": 14, "from": ["s394"], "align": "s396", "graph": { "bg": "bg/cmo_10" } } },
	"s396": { "r": "his", "d": "07b", "fc": { "col": 15, "from": ["s393", "a394"], "graph": { "bg": "bg/bg_40c", "c": "tachi/his_t29" } }, "deadEnd": true },
	"s528": { "r": "his", "d": "07b", "osiete": true },
	"s397": { "r": "his", "d": "06a", "s": "5a", "fc": { "col": 14, "from": ["s395"], "graph": { "bg": "bg/bg_12b" } } },
	"s398": { "r": "his", "d": "06a", "s": "5b", "fc": { "col": 15, "from": ["s395"], "graph": { "bg": "bg/bg_26a" } } },
	"s399": { "r": "his", "d": "07a", "s": "1", "fc": { "col": 14, "from": ["s397", "s398"], "graph": { "bg": "bg/bg_33b", "c": "tachi/his_t01" } } },
	"s400": { "r": "his", "d": "07a", "s": "2a", "fc": { "col": 14, "from": ["s399"], "graph": { "bg": "bg/bg_42b", "c": "tachi/koha_t05" } } },
	"s401": { "r": "his", "d": "07a", "s": "2b", "fc": { "col": 15, "from": ["s399"], "graph": { "bg": "event/his_e05" } } },
	"s402": { "r": "his", "d": "07a", "s": "3", "fc": { "col": 14, "from": ["s400", "s401"], "graph": { "bg": "event/his_h14" } }, "h": true, "//": "day=8,9,10,11,12 inside scene" },
	"s404": { "r": "his", "d": "12a", "s": "4a", "fc": { "col": 14, "from": ["s402"], "graph": { "bg": "event/his_h03" } }, "h": true },
	"s403": { "r": "his", "d": "12a", "s": "4b", "fc": { "col": 15, "from": ["s402"], "graph": { "bg": "bg/bg_40a", "c": "tachi/his_t21" } } },
	"s405": { "r": "his", "d": "07a", "s": "5", "fc": { "col": 14, "from": ["s403", "s404"], "graph": { "bg": "event/aki_h13" } }, "h": true },
	"s407": { "r": "his", "d": "07a", "s": "6a", "fc": { "col": 14, "from": ["s405"], "graph": { "bg": "bg/bg_40c", "c": "tachi/aki_t11b" } } },
	"s406": { "r": "his", "d": "07a", "s": "6b", "fc": { "col": 15, "from": ["s405"], "graph": { "bg": "bg/bg_40c" } }, "h": true },
	"s408": { "r": "his", "d": "13a", "s": "1", "fc": { "col": 14, "from": ["s406", "s407"], "graph": { "bg": "bg/bg_40a" } } },
	"s410": { "r": "his", "d": "13a", "s": "2", "fc": { "col": 15, "from": ["s408"], "graph": { "bg": "bg/bg_40a" } }, "deadEnd": true },
	"s529": { "r": "his", "d": "13a", "s": "2", "osiete": true },
	"s409": { "r": "his", "d": "13a", "s": "2", "fc": { "col": 14, "from": ["s408"], "graph": { "bg": "event/his_e09" } }, "h": true },
	"s412": { "r": "his", "d": "14a", "fc": { "col": 14, "from": ["s409"], "graph": { "bg": "event/his_f03" } }, "//": "day=14 inside scene" },
	"s530": { "r": "his", "d": "14a", "osiete": true },
	"s413": { "r": "his", "d": "14b", "fc": { "col": 15, "from": ["s409"], "graph": { "bg": "event/his_f02" } }, "//": "day=14 inside scene" },
	"s531": { "r": "his", "d": "14a", "osiete": true },


	"s416": { "r": "koha", "d": "05a", "s": "1", "fc": { "col": 17, "from": ["s324"], "graph": { "bg": "event/koha_e04" } }, "h": true, "//": "day=6b,6a inside scene" },
	"s417": { "r": "koha", "d": "06a", "s": "2a", "fc": { "col": 17, "from": ["s416"], "graph": { "bg": "bg/bg_45b", "c": "tachi/koha_t12" } }, "//": "day=7 inside scene" },
	"s418": { "r": "koha", "d": "06a", "s": "2b", "fc": { "col": 18, "from": ["s416"], "graph": { "bg": "bg/bg_41", "r": "tachi/his_t21b" } }, "//": "day=7 inside scene" },
	"s419": { "r": "koha", "d": "07a", "s": "3", "fc": { "col": 17, "from": ["s417", "s418"], "graph": { "bg": "event/aki_e07a" } } },
	"s420": { "r": "koha", "d": "07a", "s": "4a", "fc": { "col": 17, "from": ["s419"], "graph": { "bg": "bg/bg_25b", "c": "tachi/aki_t27" } }, "//": "day=8 inside scene" },
	"s421": { "r": "koha", "d": "07a", "s": "4b", "fc": { "col": 18, "from": ["s419"], "graph": { "bg": "bg/bg_40a", "c": "tachi/koha_t05" } }, "//": "day=8 inside scene" },
	"s422": { "r": "koha", "d": "08a", "fc": { "col": 17, "from": ["s420", "s421"], "graph": { "bg": "event/aki_h13" } }, "h": true, "//": "day=9,10 inside scene" },
	"s423": { "r": "koha", "d": "10a", "s": "1a", "fc": { "col": 17, "from": ["s422"], "graph": { "bg": "bg/bg_40c", "c": "tachi/koha_t03b" } } },
	"s424": { "r": "koha", "d": "10a", "s": "1b", "fc": { "col": 18, "from": ["s422"], "graph": { "bg": "bg/bg_40c", "c": "tachi/koha_t08" } } },
	"s425": { "r": "koha", "d": "10a", "s": "2", "fc": { "col": 17, "from": ["s423", "s424"], "graph": { "bg": "event/koha_h03" } }, "h": true, "//": "day=11 inside scene" },
	"s426": { "r": "koha", "d": "11a", "s": "1", "fc": { "col": 17, "from": ["s425"], "graph": { "bg": "bg/ima_01", "monochrome": "#ff0000" } }, "deadEnd": true },
	"s543": { "r": "koha", "d": "11a", "s": "1", "osiete": true },
	"s427": { "r": "koha", "d": "11a", "s": "1", "fc": { "col": 18, "from": ["s425"], "graph": { "bg": "bg/bg_11d", "c": "tachi/aki_t28" } } },
	"s428": { "r": "koha", "d": "11a", "s": "2", "fc": { "col": 17, "from": ["s427"] }, "deadEnd": true },
	"s544": { "r": "koha", "d": "11a", "s": "2", "osiete": true },
	"s429": { "r": "koha", "d": "12a", "fc": { "col": 17, "from": ["s427"], "graph": { "bg": "event/koha_f01" } }, "//": "day=12 inside scene" },
	"s545": { "r": "koha", "d": "12a", "osiete": true }
}

processScenes(scenes, outputDir, prefixPath, width, height).catch(console.error)