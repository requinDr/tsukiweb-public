import fs from 'fs/promises'
import path from 'path'

import { extractXp3 } from '@tsukiweb/common/tools/extract-xp3/extractor.ts'
import { mergeVertical } from '@tsukiweb/common/tools/convert-images/editor.ts'
import { processImages as convertImages } from '@tsukiweb/common/tools/convert-images/processor.ts'
import { main as runPlusDiscScripts } from '../helpers/convert-scripts/plus_disc.ts'
import type { Paths, ToolConfig } from './pd-config.ts'
import {
  FFMPEG_AUDIO_ARGS,
  SCRIPT_LANGS,
  WAIFU2X_ARGS,
  thumbConfig,
  x2Config,
} from './config.ts'

import {
  displayPath,
  ensureEmptyDirInside,
  isMediaFile,
  listFilesRecursive,
} from '@tsukiweb/common/tools/utils/fs-utils.ts'
import { logger } from '@tsukiweb/common/tools/utils/logger.ts'
import { resolveExecutable, runCommand, withWorkingDirectory } from '@tsukiweb/common/tools/utils/process-utils.ts'
import {
  check,
  combine,
  fileExistsCheck,
  nonEmptyDirectoryCheck,
  stateFailure,
  type Check,
  type CheckDetail,
  type OrchestratorStep,
} from '@tsukiweb/common/tools/orchestrator/utils.ts'

interface StepContext {
  config: ToolConfig
  paths: Paths
}

const PD_SCENES = [
  'pd_alliance',
  'pd_geccha',
  'pd_geccha2',
  'pd_experiment',
]

const XP3_DIRS = [
  'bgimage',
  'fgimage',
  'sound',
]

async function existingAssetNames(dirPath: string): Promise<Set<string>> {
  const files = await listFilesRecursive(dirPath)
  return new Set(files.map(file => path.parse(file).name.toLowerCase()))
}

function normalizeBgName(relativePath: string): string {
  const parsed = path.parse(relativePath)
  const normalizedName = parsed.name
    .replace(/^スクロール19a$/u, 'scroll19a')
    .replace(/^スクロール19b$/u, 'scroll19b')

  return path.join(parsed.dir, `${normalizedName}${parsed.ext.toLowerCase()}`)
}

function normalizeTachiName(relativePath: string): string {
  const parsed = path.parse(relativePath)
  const normalizedName = parsed.name
    .replace(/^(?:志貴_|shiki_)/u, 'shiki_')
    .replace(/^(?:瀬尾_|seo_)/u, 'akira_')
    .replace(/^nero_t02C$/, 'nero_t02c')

  return path.join(parsed.dir, `${normalizedName}${parsed.ext.toLowerCase()}`)
}

async function copyNewAssets(
  sourceDir: string,
  targetDir: string,
  existingNames: Set<string>,
  normalizeName: (name: string) => string,
): Promise<void> {
  const files = (await listFilesRecursive(sourceDir)).filter(file => /\.(png|jpe?g|webp)$/i.test(file))
  let copied = 0
  let skipped = 0

  for (const file of files) {
    const relativeTarget = normalizeName(file)
    const finalName = path.parse(relativeTarget).name.toLowerCase()
    if (existingNames.has(finalName)) {
      skipped++
      continue
    }

    await fs.mkdir(path.dirname(path.join(targetDir, relativeTarget)), { recursive: true })
    await fs.copyFile(path.join(sourceDir, file), path.join(targetDir, relativeTarget))
    copied++
  }

  logger.log(`Copied ${copied} new asset(s), skipped ${skipped} existing asset(s).`)
}

async function convertAudioTree(
  ffmpeg: Awaited<ReturnType<typeof resolveExecutable>>,
  inputDir: string,
  outputDir: string,
): Promise<void> {
  const files = (await listFilesRecursive(inputDir)).filter(isMediaFile)
  const outputPaths = new Set<string>()

  for (let i = 0; i < files.length; i++) {
    const relativePath = files[i]
    const inputPath = path.join(inputDir, relativePath)
    const outputPath = path.join(outputDir, path.dirname(relativePath), `${path.parse(relativePath).name}.webm`)

    if (outputPaths.has(outputPath)) {
      throw new Error(`Duplicate output audio file "${displayPath(outputPath)}".`)
    }
    outputPaths.add(outputPath)

    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    console.log(`Converting PD audio: ${i + 1}/${files.length} ${relativePath}`)
    await runCommand(ffmpeg.command, [
      '-y',
      '-i', inputPath,
      ...FFMPEG_AUDIO_ARGS,
      outputPath,
    ], { cwd: ffmpeg.cwd })
  }
}

async function extractAssets(context: StepContext): Promise<void> {
  const { config, paths } = context

  await ensureEmptyDirInside(paths.workspace, paths.extracted)
  await ensureEmptyDirInside(paths.workspace, paths.input)

  await extractXp3(paths.archive, paths.extracted, XP3_DIRS)
  await copyNewAssets(
    path.join(paths.extracted, 'bgimage'),
    paths.inputBg,
    await existingAssetNames(paths.imagesBg),
    normalizeBgName,
  )
  await copyNewAssets(
    path.join(paths.extracted, 'fgimage'),
    paths.inputTachi,
    await existingAssetNames(paths.imagesTachi),
    normalizeTachiName,
  )

  const ffmpeg = await resolveExecutable(config.FFMPEG, paths.tools)
  await convertAudioTree(ffmpeg, path.join(paths.extracted, 'sound'), paths.wavePd)
}

async function processScripts(paths: Paths): Promise<void> {
  await withWorkingDirectory(paths.convertScriptsTool, () => {
    runPlusDiscScripts()
  })
}

async function upscaleImages(context: StepContext): Promise<void> {
  const { config, paths } = context
  const executable = await resolveExecutable(config.WAIFU2X_CAFFE, paths.tools)

  await runCommand(executable.command, [
    '-i', paths.input,
    '-o', paths.inputX2,
    ...WAIFU2X_ARGS,
  ], { cwd: executable.cwd })
}

async function runImageConversion(paths: Paths): Promise<void> {
  const thumb = thumbConfig(paths)
  const x2 = x2Config(paths)

  await mergeVertical(
    path.join(thumb.inputDir, 'bg', 'scroll19b.jpg'),
    path.join(thumb.inputDir, 'bg', 'scroll19a.jpg'),
    path.join(thumb.inputDir, 'bg', 'scroll19.jpg'),
  )
  await convertImages(thumb.inputDir, thumb.outputDir, thumb.options)

  await mergeVertical(
    path.join(x2.inputDir, 'bg', 'scroll19b.png'),
    path.join(x2.inputDir, 'bg', 'scroll19a.png'),
    path.join(x2.inputDir, 'bg', 'scroll19.png'),
  )
  await convertImages(x2.inputDir, x2.outputDir, x2.options)
}

async function convertedImagesConfigCheck(inputDir: string, outputDir: string): Promise<CheckDetail[]> {
  const files = (await listFilesRecursive(inputDir)).filter(file => /\.(png|jpe?g|webp)$/i.test(file))

  if (!files.length) {
    return [check(false, stateFailure(displayPath(inputDir), 'empty'))]
  }

  return Promise.all(files.map(async file => {
    const parsed = path.parse(file)
    const outputPath = path.join(outputDir, parsed.dir, `${parsed.name}.avif`)
    return fileExistsCheck(outputPath, displayPath(outputPath))
  }))
}

async function convertedImagesCheck(paths: Paths): Promise<Check> {
  const thumb = thumbConfig(paths)
  const x2 = x2Config(paths)

  return combine([
    ...(await convertedImagesConfigCheck(thumb.inputDir, thumb.outputDir)),
    ...(await convertedImagesConfigCheck(x2.inputDir, x2.outputDir)),
  ])
}

async function scriptsOutputCheck(paths: Paths): Promise<Check> {
  const checks: CheckDetail[] = []

  for (const lang of SCRIPT_LANGS) {
    for (const scene of PD_SCENES) {
      const scenePath = path.join(paths.publicAssets, 'static', lang, 'scenes', `${scene}.txt`)
      checks.push(await fileExistsCheck(scenePath, displayPath(scenePath)))
    }
  }

  return combine(checks)
}

async function executableCheck(configValue: string, baseDir: string): Promise<CheckDetail> {
  const executable = await resolveExecutable(configValue, baseDir)
  const displayName = path.isAbsolute(executable.command)
    ? displayPath(executable.command)
    : executable.command
  return check(executable.found, `${displayName} is unavailable`)
}

export function createSteps(context: StepContext): OrchestratorStep[] {
  const { config, paths } = context

  return [
    {
      id: 1,
      title: 'Extract data.xp3',
      canRun: async () => combine([
        await fileExistsCheck(paths.archive, displayPath(paths.archive)),
        await executableCheck(config.FFMPEG, paths.tools),
      ]),
      isDone: async () => combine([
        await nonEmptyDirectoryCheck(paths.inputBg, '_workspace_pd/input/bg'),
        await nonEmptyDirectoryCheck(paths.inputTachi, '_workspace_pd/input/tachi'),
        await nonEmptyDirectoryCheck(paths.wavePd, displayPath(paths.wavePd)),
      ]),
      run: async () => extractAssets(context),
    },
    {
      id: 2,
      title: 'Process scripts',
      canRun: async () => combine([]),
      isDone: async () => scriptsOutputCheck(paths),
      run: async () => processScripts(paths),
    },
    {
      id: 3,
      title: 'Upscale images with waifu2x',
      canRun: async () => combine([
        await executableCheck(config.WAIFU2X_CAFFE, paths.tools),
        await nonEmptyDirectoryCheck(paths.inputBg, '_workspace_pd/input/bg'),
        await nonEmptyDirectoryCheck(paths.inputTachi, '_workspace_pd/input/tachi'),
      ]),
      isDone: async () => combine([
        await nonEmptyDirectoryCheck(paths.inputX2Bg, '_workspace_pd/input_x2/bg'),
        await nonEmptyDirectoryCheck(paths.inputX2Tachi, '_workspace_pd/input_x2/tachi'),
      ]),
      run: async () => upscaleImages(context),
    },
    {
      id: 4,
      title: 'Convert images',
      canRun: async () => combine([
        await nonEmptyDirectoryCheck(paths.inputBg, '_workspace_pd/input/bg'),
        await nonEmptyDirectoryCheck(paths.inputTachi, '_workspace_pd/input/tachi'),
        await nonEmptyDirectoryCheck(paths.inputX2Bg, '_workspace_pd/input_x2/bg'),
        await nonEmptyDirectoryCheck(paths.inputX2Tachi, '_workspace_pd/input_x2/tachi'),
      ]),
      isDone: async () => convertedImagesCheck(paths),
      run: async () => runImageConversion(paths),
    },
  ]
}
