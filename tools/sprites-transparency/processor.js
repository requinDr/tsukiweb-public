import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
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
		const metadata = await sharp(inputPath).metadata()
		const { width, height } = metadata
		const halfWidth = Math.floor(width / 2)
		
		// 1. Left side = color image
		const imageBuffer = await sharp(inputPath)
			.extract({ left: 0, top: 0, width: halfWidth, height: height })
			.toBuffer()
		
		// 2. Right side = mask (alpha channel)
		const maskBuffer = await sharp(inputPath)
			.extract({ left: halfWidth, top: 0, width: halfWidth, height: height })
			.grayscale()
			.negate()     // Invert the mask so that white = transparent, black = opaque
			.toBuffer()
		
		// 3. Apply the mask to the image
		await sharp(imageBuffer)
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
		
		let successCount = 0
		for (const [index, file] of imageFiles.entries()) {
			const inputPath = path.join(inputDir, file)
			const outputPath = path.join(outputDir, `${path.parse(file).name}.png`)
			
			logProgress(`Processing image ${index + 1}/${totalImages}: ${file}`)
			
			const success = await applyTransparencyMaskToImage(inputPath, outputPath)
			if (success) successCount++
		}
		
		logProgress(`Processing complete. ${successCount}/${totalImages}\n`)
	} catch (error) {
		logError(`Error processing images: ${error.message}`)
	}
}