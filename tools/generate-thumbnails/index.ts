import fs from 'fs'
import { buildSpritesheets, type Scene } from '../../tsukiweb-common/tools/generate-thumbnails/processor.ts'
import { logger } from '../../tsukiweb-common/tools/utils/logger.ts'


/**
 * 1) Put in the input folder: bg, event and tachi folders.
 * 2) Run to create the spritesheet
 */

const SCENE_ATTRS = JSON.parse(fs.readFileSync('../../src/assets/game/scene_attrs.json', 'utf8'))?.scenes ?? {}
const INPUT_SCENES = Object.entries(SCENE_ATTRS).filter(
  (entry): entry is [string, Scene] => {
    const [, sceneData] = entry as [string, any]
    return sceneData?.hasOwnProperty('col') && sceneData?.graph && !sceneData?.osiete
  }
)
const INPUT_IMAGES = '../../public/static/jp/images_thumb/'
const OUTPUT_THUMBNAILS = '../../public/res/flowchart-spritesheets/'
const OUTPUT_METADATA = '../../src/assets/game/'

async function main() {
  logger.section('Generating spritesheets')

  if (!fs.existsSync(INPUT_IMAGES)) {
    logger.error(`Input folder "${INPUT_IMAGES}" does not exist. Please create it and add images.`)
    return
  }
  await buildSpritesheets(INPUT_SCENES, INPUT_IMAGES, OUTPUT_THUMBNAILS, OUTPUT_METADATA)
 
  logger.log('Done ✓')
}

main()