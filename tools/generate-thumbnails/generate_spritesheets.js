import fs from 'fs'
import path from 'path'
import { isHexColor, saveSpritesheet, generateFlowchartImage } from './utils.js'


const scenes = JSON.parse(fs.readFileSync('scenes-graphics.json', 'utf8'))
const prefixPath = '../../public/static/jp/image/'
const outputDir = 'output/'
const width = 108
const height = 72

const imageFormat = 'avif'
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
		d: { w: width, h: height },
		f: [],
		i: {}
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
				const fileName = `spritesheet_${batchIndex}.${imageFormat}`

				let fileIndex = jsonMetadata.f.indexOf(fileName)
				if (fileIndex === -1) {
					jsonMetadata.f.push(fileName)
					fileIndex = jsonMetadata.f.length - 1
				}

				// Calculate metadata for this scene
				jsonMetadata.i[sceneName] = [
					Math.floor(batchPosition / 10) * height,
					(batchPosition % 10) * width,
					fileIndex
				]

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
	fs.writeFileSync(metadataPath, JSON.stringify(jsonMetadata))
	console.log(`Metadata saved to ${metadataPath}`)
}


processScenes(scenes, outputDir, prefixPath, width, height).catch(console.error)
