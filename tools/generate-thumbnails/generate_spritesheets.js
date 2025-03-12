import fs from 'fs'
import path from 'path'
import { isHexColor, saveSpritesheet, generateFlowchartImage } from './utils.js'


const scenes = JSON.parse(fs.readFileSync('scenes-graphics.json', 'utf8'))
const prefixPath = '../../public/static/jp/image_thumb/'
const outputDir = 'output/'
const width = 108
const height = 72

const imageFormat = 'webp'
const ensureExtension = (filePath) => (filePath ? `${filePath}.${imageFormat}` : null)

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
					bg: isHexColor(bg) ? bg : path.join(prefixPath, ensureExtension(bg)),
					l: l ? path.join(prefixPath, ensureExtension(l)) : null,
					c: c ? path.join(prefixPath, ensureExtension(c)) : null,
					r: r ? path.join(prefixPath, ensureExtension(r)) : null,
					monochrome,
					width,
					height,
					format: imageFormat
				})

				thumbnails.push(thumbBuffer)

				const batchPosition = thumbnails.length - 1

				// Calculate metadata for this scene
				jsonMetadata.images[sceneName] = {
					file: `spritesheet_${batchIndex}.${imageFormat}`,
					top: Math.floor(batchPosition / 10) * height, // Assuming 10 columns
					left: (batchPosition % 10) * width
				}

				// Save spritesheet when batch is full
				if (thumbnails.length === batchSize) {
					await saveSpritesheet(thumbnails, outputDir, batchIndex, width, height, imageFormat)
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
		await saveSpritesheet(thumbnails, outputDir, batchIndex, width, height, imageFormat)
	}

	// Write JSON metadata
	const metadataPath = path.join(outputDir, "spritesheet_metadata.json")
	fs.writeFileSync(metadataPath, JSON.stringify(jsonMetadata, null, 2))
	console.log(`Metadata saved to ${metadataPath}`)
}


processScenes(scenes, outputDir, prefixPath, width, height).catch(console.error)
