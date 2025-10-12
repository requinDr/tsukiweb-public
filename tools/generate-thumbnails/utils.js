import sharp from 'sharp'
import path from 'path'

export const isHexColor = (str) => /^#[0-9A-Fa-f]{6}$/.test(str)

// return buffer
export async function generateFlowchartImage({ bg, l, c, r, monochrome, width, height }) {
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
		const bgBuffer = await sharp(bg).resize(width, height, { fit: 'cover' }).toBuffer()
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

	// return canvas.composite(layers).toBuffer()
	return canvas.composite(layers).toFormat("avif").toBuffer()
}

// Helper function to generate a spritesheet
export async function saveSpritesheet(thumbnails, outputDir, fileName, thumbWidth, thumbHeight) {
	const cols = 10 // Number of thumbnails per row
	const rows = Math.ceil(thumbnails.length / cols)
	const spritesheetPath = path.join(outputDir, fileName)

	const compositeImages = thumbnails.map((thumb, i) => ({
		input: thumb,
		left: (i % cols) * thumbWidth,
		top: Math.floor(i / cols) * thumbHeight,
	}))

	const canvas = {
		create: {
			width: cols * thumbWidth,
			height: rows * thumbHeight,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	}

	const avifPromise = sharp(canvas)
		.composite(compositeImages)
		.toFormat('avif')
		.avif({ effort: 9, quality: 40 })
		.toFile(spritesheetPath + ".avif")
	
	const webpPromise = sharp(canvas)
		.composite(compositeImages)
		.toFormat('webp')
		.webp({ effort: 6, preset: 'drawing', quality: 70 })
		.toFile(spritesheetPath + ".webp")

	await Promise.all([avifPromise, webpPromise])
}