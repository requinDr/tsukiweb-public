import fs from 'fs/promises'
import path from 'path'

import { extractSar } from '@tsukiweb/common/tools/extract-sar/extractor.ts'
import { extractNscript } from '@tsukiweb/common/tools/extract-dat/extractor.ts'
import { processImages as applySpriteTransparency } from '@tsukiweb/common/tools/transform-sprites/processor.ts'
import { processImages as convertImages } from '@tsukiweb/common/tools/convert-images/processor.ts'
import { mergeVertical } from '@tsukiweb/common/tools/convert-images/editor.ts'
import { buildSpritesheets } from '@tsukiweb/common/tools/generate-thumbnails/processor.ts'
import { main as runLogicScripts } from '../helpers/convert-scripts/processing/logic.ts'
import { main as runSceneScripts } from '../helpers/convert-scripts/processing/scenes.ts'
import type { Scene } from '@tsukiweb/common/tools/generate-thumbnails/processor.ts'
import {
  FFMPEG_AUDIO_ARGS,
  SCRIPT_LANGS,
  WAIFU2X_ARGS,
  thumbConfig,
  x2Config,
  type Paths,
  type ToolConfig,
} from './config.ts'

import {
  copyDirectory,
  directoryHasFiles,
  displayPath,
  ensureEmptyDirInside,
  isMediaFile,
  listFilesRecursive,
  pathExists,
} from '@tsukiweb/common/tools/utils/fs-utils.ts'
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

const ARC_SAR_DIRS = [
  'wave',
  'image/bg',
  'image/event',
  'image/tachi',
]

async function arcSarDirsCheck(paths: Paths): Promise<Check> {
  return combine(await Promise.all(
    ARC_SAR_DIRS.map(dir => nonEmptyDirectoryCheck(path.join(paths.arcSar, dir), `_workspace/arc_sar/${dir}`))
  ))
}

async function inputImageDirChecks(paths: Paths): Promise<CheckDetail[]> {
  return Promise.all([
    nonEmptyDirectoryCheck(path.join(paths.input, 'tachi'), '_workspace/input/tachi'),
    nonEmptyDirectoryCheck(path.join(paths.input, 'bg'), '_workspace/input/bg'),
    nonEmptyDirectoryCheck(path.join(paths.input, 'event'), '_workspace/input/event'),
  ])
}

async function extractedAssetsAndInputImagesCheck(paths: Paths): Promise<Check> {
  const extractedAssets = await arcSarDirsCheck(paths)
  const inputImages = await inputImageDirChecks(paths)
  return combine([...extractedAssets.details, ...inputImages])
}

async function scriptsOutputCheck(paths: Paths): Promise<Check> {
  const checks: CheckDetail[] = []

  for (const lang of SCRIPT_LANGS) {
    const scenesDir = path.join(paths.staticJp, '..', lang, 'scenes')
    checks.push(await nonEmptyDirectoryCheck(scenesDir, displayPath(scenesDir)))
  }

  return combine(checks)
}

async function prepareInputFolder(paths: Paths): Promise<void> {
  const source = path.join(paths.arcSar, 'image', 'tachi')
  const tachiOutput = path.join(paths.input, 'tachi')

  if (path.resolve(source) === path.resolve(tachiOutput)) {
    throw new Error('Refusing to write transparent tachi over the ARC_SAR source folder.')
  }

  const sourceFilesBefore = await listFilesRecursive(source)
  await ensureEmptyDirInside(paths.workspace, tachiOutput)
  await applySpriteTransparency(source, tachiOutput)

  const sourceFilesAfter = await listFilesRecursive(source)
  if (sourceFilesAfter.length !== sourceFilesBefore.length) {
    throw new Error('ARC_SAR tachi source changed while generating transparent sprites.')
  }

  await copyDirectory(path.join(paths.arcSar, 'image', 'bg'), path.join(paths.input, 'bg'), paths.workspace)
  await copyDirectory(path.join(paths.arcSar, 'image', 'event'), path.join(paths.input, 'event'), paths.workspace)
}

async function extractAssetsAndPrepareImages(paths: Paths): Promise<void> {
  await extractSar(paths.arcSarArchive, paths.arcSar, ARC_SAR_DIRS)
  const nscript = path.join(paths.tools, 'nscript.dat')
  if (await pathExists(nscript)) {
    await extractNscript(nscript, path.join(paths.staticJp, 'fullscript_jp.txt'))
  }
  await prepareInputFolder(paths)
}

async function runScripts(paths: Paths): Promise<void> {
  await withWorkingDirectory(paths.convertScriptsTool, async () => {
    runLogicScripts()
    await runSceneScripts()
  })
}

async function runWaifu2x(context: StepContext): Promise<void> {
  const executable = await resolveExecutable(context.config.WAIFU2X_CAFFE, context.paths.tools)
  const args = [
    '-i', context.paths.input,
    '-o', context.paths.inputX2,
    ...WAIFU2X_ARGS,
  ]

  await runCommand(executable.command, args, { cwd: executable.cwd })
}

async function runImageConversion(paths: Paths): Promise<void> {
  const thumb = thumbConfig(paths)
  const x2 = x2Config(paths)

  await mergeVertical(
    path.join(thumb.inputDir, 'event', 'cel_e06a.jpg'),
    path.join(thumb.inputDir, 'event', 'cel_e06b.jpg'),
    path.join(thumb.inputDir, 'event', 'cel_e06.jpg'),
  )
  await mergeVertical(
    path.join(thumb.inputDir, 'event', 'koha_h06a.jpg'),
    path.join(thumb.inputDir, 'event', 'koha_h06b.jpg'),
    path.join(thumb.inputDir, 'event', 'koha_h06.jpg'),
  )
  await convertImages(thumb.inputDir, thumb.outputDir, thumb.options)

  await mergeVertical(
    path.join(x2.inputDir, 'event', 'cel_e06a.png'),
    path.join(x2.inputDir, 'event', 'cel_e06b.png'),
    path.join(x2.inputDir, 'event', 'cel_e06.png'),
  )
  await mergeVertical(
    path.join(x2.inputDir, 'event', 'koha_h06a.png'),
    path.join(x2.inputDir, 'event', 'koha_h06b.png'),
    path.join(x2.inputDir, 'event', 'koha_h06.png'),
  )
  await convertImages(x2.inputDir, x2.outputDir, x2.options)
}

async function runSpritesheets(paths: Paths): Promise<void> {
  const sceneAttrs = JSON.parse(await fs.readFile(paths.sceneAttrs, 'utf8'))
  const flowchart = JSON.parse(await fs.readFile(path.join(paths.sceneAssets, 'flowchart.json'), 'utf8'))
  const scenes = Object.keys(flowchart.scenes ?? {})
    .filter(name => sceneAttrs['scene-graphs']?.[name])
    .map(name => [name, { graph: sceneAttrs['scene-graphs'][name] }] as [string, Scene])

  if (!scenes.length) {
    throw new Error('No flowchart scenes with graphics found; spritesheet metadata was not changed.')
  }

  await buildSpritesheets(scenes, paths.imagesThumb, paths.flowchartSpritesheets, paths.sceneAssets)
}

async function convertAudioTree(
  ffmpeg: Awaited<ReturnType<typeof resolveExecutable>>,
  inputDir: string,
  outputDir: string,
  outputName: (relativePath: string) => string = relativePath => `${path.parse(relativePath).name}.webm`,
): Promise<void> {
  const files = (await listFilesRecursive(inputDir)).filter(isMediaFile)
  const outputPaths = new Set<string>()

  for (let i = 0; i < files.length; i++) {
    const relativePath = files[i]
    const inputPath = path.join(inputDir, relativePath)
    const outputPath = path.join(outputDir, path.dirname(relativePath), outputName(relativePath))

    if (outputPaths.has(outputPath)) {
      throw new Error(`Duplicate output audio file "${displayPath(outputPath)}".`)
    }
    outputPaths.add(outputPath)

    await fs.mkdir(path.dirname(outputPath), { recursive: true })
    console.log(`Converting audio: ${i + 1}/${files.length} ${relativePath}`)
    await runCommand(ffmpeg.command, [
      '-y',
      '-i', inputPath,
      ...FFMPEG_AUDIO_ARGS,
      outputPath,
    ], { cwd: ffmpeg.cwd })
  }
}

function cdTrackOutputName(relativePath: string): string {
  const filename = path.parse(relativePath).name
  const track = filename.match(/\d+/)?.[0]
  if (!track) {
    throw new Error(`Cannot find track number in "${relativePath}".`)
  }

  return `track${track.padStart(2, '0')}.webm`
}

async function runWaveConversion(context: StepContext): Promise<void> {
  const ffmpeg = await resolveExecutable(context.config.FFMPEG, context.paths.tools)
  await convertAudioTree(ffmpeg, path.join(context.paths.arcSar, 'wave'), context.paths.wave)
}

async function runCdConversion(context: StepContext): Promise<void> {
  const ffmpeg = await resolveExecutable(context.config.FFMPEG, context.paths.tools)

  for (const [name, dirs] of Object.entries(context.paths.cds)) {
    if (!(await directoryHasFiles(dirs.input))) continue
    console.log(`\n${name}`)
    await convertAudioTree(ffmpeg, dirs.input, dirs.output, cdTrackOutputName)
  }
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
      title: 'Extract arc.sar/nscript.dat and prepare images',
      canRun: async () => combine([
        await fileExistsCheck(paths.arcSarArchive, displayPath(paths.arcSarArchive)),
      ]),
      isDone: async () => extractedAssetsAndInputImagesCheck(paths),
      run: async () => extractAssetsAndPrepareImages(paths),
    },
    {
      id: 2,
      title: 'Process fullscripts',
      canRun: async () => combine([]),
      isDone: async () => scriptsOutputCheck(paths),
      run: async () => runScripts(paths),
    },
    {
      id: 3,
      title: 'Upscale images with waifu2x',
      canRun: async () => combine([
        await executableCheck(config.WAIFU2X_CAFFE, paths.tools),
        ...(await inputImageDirChecks(paths)),
      ]),
      isDone: async () => combine([
        await nonEmptyDirectoryCheck(paths.inputX2, '_workspace/input_x2'),
      ]),
      run: async () => runWaifu2x(context),
    },
    {
      id: 4,
      title: 'Convert images',
      canRun: async () => combine([
        await nonEmptyDirectoryCheck(paths.input, '_workspace/input'),
        await nonEmptyDirectoryCheck(paths.inputX2, '_workspace/input_x2'),
      ]),
      isDone: async () => combine([
        await nonEmptyDirectoryCheck(paths.images, displayPath(paths.images)),
        await nonEmptyDirectoryCheck(paths.imagesThumb, displayPath(paths.imagesThumb)),
      ]),
      run: async () => runImageConversion(paths),
    },
    {
      id: 5,
      title: 'Create spritesheets',
      canRun: async () => combine([
        await nonEmptyDirectoryCheck(paths.imagesThumb, displayPath(paths.imagesThumb)),
      ]),
      isDone: async () => combine([
        await nonEmptyDirectoryCheck(paths.flowchartSpritesheets, displayPath(paths.flowchartSpritesheets)),
      ]),
      run: async () => runSpritesheets(paths),
    },
    {
      id: 6,
      title: 'Convert wave files',
      canRun: async () => combine([
        await executableCheck(config.FFMPEG, paths.tools),
        await nonEmptyDirectoryCheck(path.join(paths.arcSar, 'wave'), '_workspace/arc_sar/wave'),
      ]),
      isDone: async () => combine([
        await nonEmptyDirectoryCheck(paths.wave, displayPath(paths.wave)),
      ]),
      run: async () => runWaveConversion(context),
    },
    {
      id: 7,
      title: 'Convert audio CDs',
      canRun: async () => {
        const executable = await executableCheck(config.FFMPEG, paths.tools)
        const cdChecks = await Promise.all(
          Object.values(paths.cds).map(async dirs =>
            nonEmptyDirectoryCheck(dirs.input, displayPath(dirs.input))
          )
        )

        return combine([
          executable,
          check(
            cdChecks.some(item => item.ok),
            `${cdChecks.map(item => {
              if (typeof item.failure === 'object') return item.failure.target
              return item.failure
            }).join(', ')} are all empty`,
          ),
        ])
      },
      isDone: async () => combine(await Promise.all(
        Object.values(paths.cds).map(async dirs =>
          check(
            await directoryHasFiles(dirs.output),
            stateFailure(displayPath(dirs.output), 'empty'),
          )
        )
      )),
      run: async () => runCdConversion(context),
    },
  ]
}
