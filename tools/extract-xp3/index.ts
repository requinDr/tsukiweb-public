import { logger } from '../../tsukiweb-common/tools/utils/logger.ts'
import { extractXp3 } from '../../tsukiweb-common/tools/extract-xp3/extractor.ts'

/**
 * 1) Place data.xp3 next to this script.
 * 2) Keep only the folders you want to extract in extractedDirs.
 */
const archivePath = 'data.xp3'
const outputDir = './'
const extractedDirs = [
  'bgimage',
  'fgimage',
  'sound',
  'scenario/きのこ名作実験場.ks',
  'scenario/げっちゃ.ks',
  'scenario/幻視同盟.ks',
  'scenario/真・弓塚夢想3.ks',
]

async function main() {
  try {
    logger.section(`Extracting files from "${archivePath}"`)
    await extractXp3(archivePath, outputDir, extractedDirs)
    logger.log('Done')
  } catch (error) {
    logger.error(`An error occurred: ${(error as Error).message}`)
  }
}

main()
