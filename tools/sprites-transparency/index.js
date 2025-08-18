import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

// 1) Run once to create the input and output directories
// 2) Place the jpg images in the "input" folder
// 3) Run the script to process the images

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
		
		// 1. Extract the base image (left part)
		const imageBuffer = await sharp(inputPath)
			.extract({ left: 0, top: 0, width: halfWidth, height: height })
			.toBuffer()
		
		// 2. Extract the mask (right part) and prepare it as an alpha channel
		// White = 0% opacity, Black = 100% opacity
		const maskBuffer = await sharp(inputPath)
			.extract({ left: halfWidth, top: 0, width: halfWidth, height: height })
			.grayscale()  // Convert to grayscale
			.negate()     // Invert the mask so that white = transparent, black = opaque
			.toBuffer()
		
		// 3. Explicitly convert the image to RGBA and replace the alpha channel
		await sharp(imageBuffer)
			.toColorspace('srgb')  // Ensure the image is in RGB
			.ensureAlpha()         // Add an alpha channel (initially 100% opaque)
			.removeAlpha()         // Remove the default alpha channel
			.joinChannel(maskBuffer)  // Add the mask as the alpha channel
			.png()                 // Output format PNG (supports transparency)
			.toFile(outputPath)
		
		console.log(`Image successfully processed: ${outputPath}`)
		return true
	} catch (error) {
		console.error(`Error processing image ${inputPath}:`, error)
		return false
	}
}

async function processAllImages() {
	try {
		const inputDir = 'input'
		const outputDir = 'output'
		
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

processAllImages()