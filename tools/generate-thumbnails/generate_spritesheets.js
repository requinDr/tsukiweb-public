import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const scenes = JSON.parse(fs.readFileSync('scenes-graphics.json', 'utf8'))

const prefixPath = '../../public/static/jp/image_thumb/'
const outputDir = 'output/'
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
	let jsonMetadata = {
		dimensions: { width, height },
		images: {}
	}

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
				jsonMetadata.images[sceneName] = {
					file: `spritesheet_${batchIndex}.webp`,
					top: Math.floor(batchPosition / 10) * height, // Assuming 10 columns
					left: (batchPosition % 10) * width
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


processScenes(scenes, outputDir, prefixPath, width, height).catch(console.error)
