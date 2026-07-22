import fs from 'node:fs/promises'
import path from 'node:path'

import { extractNscript } from '@tsukiweb/common/tools/extract-dat/extractor.ts'
import { extractSar } from '@tsukiweb/common/tools/extract-sar/extractor.ts'
import { extractXp3 } from '@tsukiweb/common/tools/extract-xp3/extractor.ts'
import { processImages } from '@tsukiweb/common/tools/transform-sprites/processor.ts'
import { logger } from '@tsukiweb/common/tools/utils/logger.ts'

type InputKind = 'dat' | 'xp3' | 'sar' | 'tachi'

function inputKind(name: string, isDirectory: boolean): InputKind | undefined {
  if (isDirectory) return name.toLowerCase() === 'tachi' ? 'tachi' : undefined
  const extension = path.extname(name).slice(1).toLowerCase()
  return ['dat', 'xp3', 'sar'].includes(extension) ? extension as InputKind : undefined
}

async function processTachi(inputDir: string): Promise<void> {
  const files = await fs.readdir(inputDir)
  const outputs = files
    .filter(file => ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase()))
    .map(file => `${path.parse(file).name}.png`)
  if (!outputs.length) throw new Error(`No images found in "${inputDir}".`)

  const tempDir = `${inputDir}.extract-${process.pid}`
  await fs.rename(inputDir, tempDir)
  try {
    await processImages(tempDir, inputDir)
    await Promise.all(outputs.map(file => fs.access(path.join(inputDir, file))))
  } catch (error) {
    await fs.rm(inputDir, { recursive: true, force: true })
    await fs.rename(tempDir, inputDir)
    throw error
  }
  await fs.rm(tempDir, { recursive: true })
}

async function main(): Promise<void> {
  const inputs = (await fs.readdir('.', { withFileTypes: true }))
    .map(entry => ({ name: entry.name, kind: inputKind(entry.name, entry.isDirectory()) }))
    .filter((input): input is { name: string, kind: InputKind } => input.kind !== undefined)

  if (!inputs.length) {
    logger.log('Nothing to process (.dat, .xp3, .sar or tachi).')
    return
  }

  for (const input of inputs) {
    logger.section(`Processing ${input.name}`)
    if (input.kind === 'dat') {
      await extractNscript(input.name, `${path.parse(input.name).name}.txt`)
    } else if (input.kind === 'xp3') {
      await extractXp3(input.name, '.')
    } else if (input.kind === 'sar') {
      await extractSar(input.name, '.')
    } else {
      await processTachi(input.name)
    }
  }
}

await main()
