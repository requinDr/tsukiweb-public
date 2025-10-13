import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { logProgress, logError } from '../utils/logging.js'

async function ensureDirectoryExists(dir) {
	try {
		await fs.access(dir)
	} catch (error) {
		await fs.mkdir(dir, { recursive: true })
		logProgress(`Folder "${dir}" successfully created.`)
	}
}

async function applyTransparencyMaskToImage(inputPath, outputPath) {
	try {
		// 1. Get the file
		const image = sharp(inputPath)
		const { width, height } = await image.metadata()
		const halfWidth = Math.floor(width / 2)
		
		// 2. Extract the mask (alpha channel) from the right side
		const maskBuffer = await image
			.clone()
			.extract({ left: halfWidth, top: 0, width: halfWidth, height: height })
			.grayscale()
			.negate()     // Invert the mask so that white = transparent, black = opaque
			.toBuffer()
		
		// 3. Apply the mask to the left side (color image)
		await image
			.extract({ left: 0, top: 0, width: halfWidth, height: height })
			.joinChannel(maskBuffer, { force: true })
			.png()
			.toFile(outputPath)
		
		return true
	} catch (error) {
		logError(`Error processing image ${inputPath}: ${error.message}`)
		return false
	}
}

/**
 * Process all JPG/JPEG images in the input directory, apply transparency masks,
 * and save the results as PNG files in the output directory.
 * @param {string} inputDir - The directory containing input images.
 * @param {string} outputDir - The directory to save processed images.
 */
export async function processImages(inputDir, outputDir) {
	try {
		await ensureDirectoryExists(inputDir)
		await ensureDirectoryExists(outputDir)

		const files = await fs.readdir(inputDir)

		const imageFiles = files.filter(file => {
			const ext = path.extname(file).toLowerCase()
			return ext === '.jpg' || ext === '.jpeg'
		})

		const totalImages = imageFiles.length
		if (totalImages === 0) {
			logError('No images found in the "input" folder.')
			return
		}

		const BATCH_SIZE = os.cpus().length
		let successCount = 0
		let processedCount = 0

		for (let i = 0; i < totalImages; i += BATCH_SIZE) {
			const batch = imageFiles.slice(i, i + BATCH_SIZE)

			const results = await Promise.all(
				batch.map(file => {
					const inputPath = path.join(inputDir, file)
					const outputPath = path.join(outputDir, `${path.parse(file).name}.png`)
					return applyTransparencyMaskToImage(inputPath, outputPath)
				})
			)

			processedCount += batch.length
			successCount += results.filter(Boolean).length
			logProgress(`Processing sprites: ${processedCount}/${totalImages}`)
		}

		logProgress(`Processing complete: ${successCount}/${totalImages}\n`)
	} catch (error) {
		logError(`Error processing images: ${error.message}`)
	}
}