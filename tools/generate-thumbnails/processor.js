import fs from 'fs'
import path from 'path'
import { isHexColor, saveSpritesheet, generateFlowchartImage } from './utils.js'
import { logError, logProgress } from '../utils/logging.js'

const IMAGE_FORMAT = 'avif'
const BATCH_SIZE = 90
const THUMB_WIDTH = 108
const THUMB_HEIGHT = 72
const ensureExtension = (filePath) => (filePath ? `${filePath}.${IMAGE_FORMAT}` : null)

export async function processScenes(scenes, inputImagesPath, outputDir, outputDirMetadata, width = THUMB_WIDTH, height = THUMB_HEIGHT) {
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true })
	}

	// 1. Filter scenes that need processing
	const validSceneEntries = Object.entries(scenes).filter(
		([, sceneData]) => sceneData?.fc?.hasOwnProperty('col') && sceneData?.fc?.graph
	)

	const totalScenes = validSceneEntries.length
	let processedCount = 0

	const updateProgress = () => {
		processedCount++
		logProgress(`Generating thumbnails: ${processedCount}/${totalScenes}`)
	}

	// 2. Create an array of promises for image generation
	const thumbnailPromises = validSceneEntries.map(([sceneName, sceneData]) => {
		const { graph } = sceneData.fc
		const { l = null, c = null, r = null, monochrome = null } = graph
		const bg = graph.bg || '#000000'

		return generateFlowchartImage({
			bg: isHexColor(bg) ? bg : path.join(inputImagesPath, ensureExtension(bg)),
			l: l ? path.join(inputImagesPath, ensureExtension(l)) : null,
			c: c ? path.join(inputImagesPath, ensureExtension(c)) : null,
			r: r ? path.join(inputImagesPath, ensureExtension(r)) : null,
			monochrome,
			width,
			height,
		})
			.then((buffer) => {
				updateProgress()
				return buffer
			})
			.catch((error) => {
				logError(`Error processing scene ${sceneName}: ${error.message}`)
				return null
			})
	})

	// 3. Run all promises in parallel
	const allThumbBuffers = await Promise.all(thumbnailPromises)

	// 4. Assemble spritesheets from the results
	console.log()
	logProgress('Assembling spritesheets...')
	let jsonMetadata = {
		d: { w: width, h: height },
		f: [],
		i: {}
	}
	let batchIndex = 0
	let thumbnailsInCurrentBatch = []
	const batchSavePromises = []

	const saveBatch = async () => {
		if (thumbnailsInCurrentBatch.length === 0) return
		const fileName = `spritesheet_${batchIndex}`
		batchSavePromises.push(saveSpritesheet(thumbnailsInCurrentBatch, outputDir, fileName, width, height))
		thumbnailsInCurrentBatch = []
		batchIndex++
	}

	for (let i = 0; i < validSceneEntries.length; i++) {
		const thumbBuffer = allThumbBuffers[i]
		if (!thumbBuffer) continue

		const [sceneName] = validSceneEntries[i]

		thumbnailsInCurrentBatch.push(thumbBuffer)

		// Metadata calculation
		const batchPos = thumbnailsInCurrentBatch.length - 1
		const fileName = `spritesheet_${batchIndex}`
		let fileIndex = jsonMetadata.f.indexOf(fileName)
		if (fileIndex === -1) {
			fileIndex = jsonMetadata.f.push(fileName) - 1
		}
		jsonMetadata.i[sceneName] = [
			Math.floor(batchPos / 10) * height,
			(batchPos % 10) * width,
			fileIndex,
		]

		if (thumbnailsInCurrentBatch.length === BATCH_SIZE) {
			saveBatch()
		}
	}

	// Save remaining thumbnails in the last batch
	saveBatch()

	await Promise.all(batchSavePromises)

	const metadataPath = path.join(outputDirMetadata, 'spritesheet_metadata.json')
	fs.writeFileSync(metadataPath, JSON.stringify(jsonMetadata))
	logProgress('Spritesheets assembled.\n')
}
