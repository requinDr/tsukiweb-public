import { logger } from '../../../tsukiweb-common/tools/utils/logger.ts'
import { extractNscript } from '../../../tsukiweb-common/tools/extract-dat/extractor.ts'

const INPUT_FILE  = './nscript.dat'
const OUTPUT_FILE = '../../../public/static/jp/fullscript_jp.txt'

async function main() {
  logger.section('nscript.dat extraction')
  try {
    logger.log(`Input : ${INPUT_FILE}`)
    logger.log(`Output: ${OUTPUT_FILE}`)
    await extractNscript(INPUT_FILE, OUTPUT_FILE)
    logger.log('Done ✓')
  } catch (error) {
    logger.error(`Error: ${(error as Error).message}`)
  }
}

main()
