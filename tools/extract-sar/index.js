import { logError } from '../../tsukiweb-common/tools/utils/logging.js'
import { extractSar } from '../../tsukiweb-common/tools/extract-sar/extractor.js'

// 1) Place arc.sar in the "tools/extract-sar" folder
// 2) Run the script to extract the files

const archivePath = 'arc.sar'
const outputDir = './'
const extractedDirs = [
	'wave',
	'image/bg',
	'image/event',
	'image/tachi'
]

async function main() {
	try {
		console.log('--- Starting archive extraction ---\n')
		await extractSar(archivePath, outputDir, extractedDirs)
		console.log('\n--- Archive extraction finished ---')
	} catch (error) {
		logError(`An error occurred: ${error.message}`)
	}
}

main()