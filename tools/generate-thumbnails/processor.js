import fs from 'fs'
import path from 'path'
import { isHexColor, saveSpritesheet, generateFlowchartImage } from './utils.js'

const IMAGE_FORMAT = 'avif'
const BATCH_SIZE = 90
const THUMB_WIDTH = 108
const THUMB_HEIGHT = 72
const ensureExtension = (filePath) => (filePath ? `${filePath}.${IMAGE_FORMAT}` : null)

export async function processScenes(scenes, inputImagesPath, outputDir, outputDirMetadata, width = THUMB_WIDTH, height = THUMB_HEIGHT) {
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true })
	}

	let jsonMetadata = {
		d: { w: width, h: height },
		f: [],
		i: {}
	}
	let batchIndex = 0
	let thumbnails = []

	const saveBatch = async () => {
		if (thumbnails.length === 0) return
		const fileName = `spritesheet_${batchIndex}`
		await saveSpritesheet(thumbnails, outputDir, fileName, width, height)
		thumbnails = []
		batchIndex++
	}

	const sceneEntries = Object.entries(scenes)
	const totalScenes = sceneEntries.length
	let processedCount = 0

	for (const [sceneName, sceneData] of sceneEntries) {
		processedCount++
		process.stdout.write(`\rGenerating thumbnails: ${processedCount}/${totalScenes}`)

		const graph = sceneData?.fc?.graph
		if (!sceneData?.fc?.hasOwnProperty("col") || !graph) {
			// console.debug(`Skipping scene ${sceneName} (unused or missing graph)`)
			continue
		}
		
		let { l = null, c = null, r = null, monochrome = null } = graph
		const bg = graph.bg || "#000000"

		try {
			const thumbBuffer = await generateFlowchartImage({
				bg: isHexColor(bg) ? bg : path.join(inputImagesPath, ensureExtension(bg)),
				l: l ? path.join(inputImagesPath, ensureExtension(l)) : null,
				c: c ? path.join(inputImagesPath, ensureExtension(c)) : null,
				r: r ? path.join(inputImagesPath, ensureExtension(r)) : null,
				monochrome,
				width,
				height
			})

			thumbnails.push(thumbBuffer)

			const batchPos = thumbnails.length - 1
			const fileName = `spritesheet_${batchIndex}.${IMAGE_FORMAT}`

			let fileIndex = jsonMetadata.f.indexOf(fileName)
			if (fileIndex === -1) {
				fileIndex = jsonMetadata.f.push(fileName) - 1
			}

			// Calculate metadata for this scene
			jsonMetadata.i[sceneName] = [
				Math.floor(batchPos / 10) * height,
				(batchPos % 10) * width,
				fileIndex
			]

			// Save spritesheet when batch is full
			if (thumbnails.length === BATCH_SIZE) await saveBatch()
		} catch (error) {
			console.error(`Error processing scene ${sceneName}:`, error.message)
		}
	}

	// Save remaining thumbnails in the last batch
	await saveBatch()

	process.stdout.write('\n')

	// Write JSON metadata
	const metadataPath = path.join(outputDirMetadata, "spritesheet_metadata.json")
	fs.writeFileSync(metadataPath, JSON.stringify(jsonMetadata))
	console.log(`Metadata saved to ${metadataPath}`)
}
