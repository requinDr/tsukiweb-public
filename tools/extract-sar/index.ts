import { logger } from '../../tsukiweb-common/tools/utils/logger.ts'
import { extractSar } from '../../tsukiweb-common/tools/extract-sar/extractor.ts'

/**
 * 1) Place arc.sar next to this script.
 * 2) Run the script to extract the files
 */
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
		logger.section(`Extracting files from "${archivePath}"`)
		await extractSar(archivePath, outputDir, extractedDirs)
		logger.log('Done ✓')
	} catch (error) {
		logger.error(`An error occurred: ${(error as Error).message}`)
	}
}

main()