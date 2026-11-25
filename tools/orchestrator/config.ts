import path from 'path'
import { fileURLToPath } from 'url'
import { positionalArgs } from '@tsukiweb/common/tools/orchestrator/runner.ts'
import { ExternalTool, FFMPEG, WAIFU2X } from '@tsukiweb/common/tools/orchestrator/external-tools.ts'

export interface CdPaths {
  input: string
  output: string
}

export interface Paths {
  tools: string
  publicAssets: string
  workspace: string
  arcArchive: string
  nscript: string
  img: string
  imgX2: string
  sceneAttrs: string
  sceneAssets: string
  staticJp: string
  images: string
  imagesThumb: string
  flowchartSpritesheets: string
  wave: string
  cds: Record<CdName, CdPaths>
}

export const TOOLS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO_DIR = path.resolve(TOOLS_DIR, '..')
const BIN_DIR = path.join(TOOLS_DIR, '_bin')
export const PUBLIC_DIR = path.join(REPO_DIR, 'public')

const CD_NAMES = ['CD_original', 'CD_everafter', 'CD_tsukibako'] as const
type CdName = typeof CD_NAMES[number]

export const BASE_LANG = 'jp'

export const WAIFU2X_ARGS = [
  '-n', '0',
  '-s', '2',
  '-m', 'models-cunet',
  '-t', '200',
  '-f', 'png',
] as const

export const FFMPEG_AUDIO_ARGS = [
  '-hide_banner',
  '-loglevel', 'error',
  '-c:a', 'libopus',
  '-b:a', '96k',
  '-vbr', 'on',
  '-mapping_family', '0',
  '-compression_level', '10',
  '-application', 'audio',
  '-map_metadata', '-1',
  '-f', 'webm',
] as const

export type ImageConversionPaths = Pick<Paths, 'img' | 'imgX2' | 'images' | 'imagesThumb'>

export function imagePathsForLanguage(
  paths: Paths,
  lang: string,
): ImageConversionPaths {
  const staticLang = path.join(paths.staticJp, '..', lang)

  return {
    img: path.join(paths.workspace, lang, 'img'),
    imgX2: path.join(paths.workspace, lang, 'img_x2'),
    images: path.join(staticLang, 'images'),
    imagesThumb: path.join(staticLang, 'images_thumb'),
  }
}

export function thumbConfig(paths: ImageConversionPaths) {
  return {
    inputDir: paths.img,
    outputDir: paths.imagesThumb,
    options: {
      resize: {
        width: 200,
        kernel: 'lanczos3',
      } as const,
      avif: {
        quality: 60,
        effort: 4,
        chromaSubsampling: '4:4:4',
        tune: 'iq'
      } as const,
    },
  }
}

export function x2Config(paths: ImageConversionPaths) {
  return {
    inputDir: paths.imgX2,
    outputDir: paths.images,
    options: {
      avif: {
        quality: 60,
        effort: 4,
        chromaSubsampling: '4:4:4',
        tune: 'iq'
      } as const,
    },
  }
}

export function gameDir(): string {
  return path.resolve(positionalArgs().join(' ') || TOOLS_DIR)
}

export function buildPaths(): Paths {
  const workspace = path.join(TOOLS_DIR, '_workspace')
  const game = gameDir()
  const staticJp = path.join(PUBLIC_DIR, 'static', BASE_LANG)

  return {
    tools: TOOLS_DIR,
    publicAssets: PUBLIC_DIR,
    workspace,
    arcArchive: path.join(game, 'arc.sar'),
    nscript: path.join(game, 'nscript.dat'),
    img: path.join(workspace, BASE_LANG, 'img'),
    imgX2: path.join(workspace, BASE_LANG, 'img_x2'),
    sceneAttrs: path.join(REPO_DIR, 'src', 'assets', 'game', 'scene_attrs.json'),
    sceneAssets: path.join(REPO_DIR, 'src', 'assets', 'game'),

    //output
    staticJp,
    images: path.join(staticJp, 'images'),
    imagesThumb: path.join(staticJp, 'images_thumb'),
    flowchartSpritesheets: path.join(PUBLIC_DIR, 'res', 'flowchart-spritesheets'),
    wave: path.join(staticJp, 'wave'),
    cds: Object.fromEntries(CD_NAMES.map(name => [
      name,
      {
        input: path.join(TOOLS_DIR, name),
        output: path.join(staticJp, name),
      },
    ])) as Record<CdName, CdPaths>,
  }
}

export type Tools = ReturnType<typeof createTools>

export function createTools() {
  return {
    waifu2x: new ExternalTool(WAIFU2X, BIN_DIR),
    ffmpeg: new ExternalTool(FFMPEG, BIN_DIR),
  }
}
