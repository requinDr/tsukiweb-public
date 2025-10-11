import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'


async function ensureDirectoryExists(dir) {
	try {
		await fs.access(dir)
	} catch (error) {
		await fs.mkdir(dir, { recursive: true })
		console.log(`Folder "${dir}" successfully created.`)
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
		
		console.log(`Image successfully processed: ${outputPath}`)
		return true
	} catch (error) {
		console.error(`Error processing image ${inputPath}:`, error)
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
		
		if (imageFiles.length === 0) {
			console.log('No images found in the "input" folder.')
			return
		}
		
		console.log(`${imageFiles.length} image(s) found for processing.`)
		
		let successCount = 0
		for (const file of imageFiles) {
			const inputPath = path.join(inputDir, file)
			const outputPath = path.join(outputDir, `${path.parse(file).name}.png`)
			
			const success = await applyTransparencyMaskToImage(inputPath, outputPath)
			if (success) successCount++
		}
		
		console.log(`Processing complete. ${successCount}/${imageFiles.length} image(s) successfully processed.`)
	} catch (error) {
		console.error('Error processing images:', error)
	}
}