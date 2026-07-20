import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath, pathToFileURL } from 'url'

export interface ToolConfig {
  ARC_SAR: string
  WAIFU2X_CAFFE: string
  FFMPEG: string
  PUBLIC: string
}

export interface CdPaths {
  input: string
  output: string
}

export interface Paths {
  repo: string
  tools: string
  publicAssets: string
  workspace: string
  arcSarArchive: string
  arcSar: string
  input: string
  inputX2: string
  convertScriptsTool: string
  sceneAttrs: string
  sceneAssets: string
  staticJp: string
  images: string
  imagesThumb: string
  flowchartSpritesheets: string
  wave: string
  cds: Record<CdName, CdPaths>
}

export const ORCHESTRATOR_DIR = path.dirname(fileURLToPath(import.meta.url))
export const TOOLS_DIR = path.resolve(ORCHESTRATOR_DIR, '..')
export const REPO_DIR = path.resolve(TOOLS_DIR, '..')
export const CONFIG_PATH = path.join(TOOLS_DIR, 'my-config.ts')

const DEFAULT_CONFIG: ToolConfig = {
  ARC_SAR: './arc.sar',
  WAIFU2X_CAFFE: 'waifu2x-caffe-cui.exe',
  FFMPEG: 'ffmpeg.exe',
  PUBLIC: '../public',
}

const CD_NAMES = ['CD_original', 'CD_everafter', 'CD_tsukibako'] as const
type CdName = typeof CD_NAMES[number]

type PartialToolConfig = Partial<ToolConfig>

export const SCRIPT_LANGS = [
  'jp',
  'en-mm',
  'es-tohnokun',
  'it-riffour',
  'pt-matsuri',
  'ko-wolhui',
  'ru-ciel',
  'zh-tw-yueji_yeren_hanhua_zu',
  'zh-yueji_yeren_hanhua_zu',
] as const

export const WAIFU2X_ARGS = [
  '-m', 'noise_scale',
  '-n', '0',
  '-s', '2',
  '-b', '8',
  '-p', 'cudnn',
  '-model_dir', 'models-cunet',
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

type ImageConversionPaths = Pick<Paths, 'input' | 'inputX2' | 'images' | 'imagesThumb'>

export function thumbConfig(paths: ImageConversionPaths) {
  return {
    inputDir: paths.input,
    outputDir: paths.imagesThumb,
    options: {
      resize: {
        width: 200,
        kernel: 'lanczos3',
      } as const,
      avif: {
        quality: 60,
        alphaQuality: 50,
        effort: 8,
        chromaSubsampling: '4:4:4',
      } as const,
    },
  }
}

export function x2Config(paths: ImageConversionPaths) {
  return {
    inputDir: paths.inputX2,
    outputDir: paths.images,
    options: {
      avif: {
        quality: 60,
        alphaQuality: 70,
        effort: 8,
        chromaSubsampling: '4:4:4',
      } as const,
    },
  }
}

function hasCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code
}

export async function loadConfig(): Promise<ToolConfig> {
  let userConfig: PartialToolConfig = {}

  try {
    const stat = await fs.stat(CONFIG_PATH)
    const configUrl = pathToFileURL(CONFIG_PATH)
    configUrl.searchParams.set('mtime', String(stat.mtimeMs))
    const module = await import(configUrl.href)
    userConfig = { ...module, ...(module.default ?? {}) } as PartialToolConfig
  } catch (error) {
    if (!hasCode(error, 'ENOENT')) {
      throw error
    }
  }

  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
  }
}

export function resolveToolPath(value: string): string {
  if (path.isAbsolute(value)) return path.normalize(value)
  return path.resolve(TOOLS_DIR, value)
}

export function buildPaths(config: ToolConfig): Paths {
  const publicAssets = resolveToolPath(config.PUBLIC)
  const workspace = path.join(TOOLS_DIR, '_workspace')
  const arcSar = path.join(workspace, 'arc_sar')
  const cds = Object.fromEntries(CD_NAMES.map(name => [
    name,
    {
      input: path.join(TOOLS_DIR, name),
      output: path.join(publicAssets, 'static', 'jp', name),
    },
  ])) as Record<CdName, CdPaths>

  return {
    repo: REPO_DIR,
    tools: TOOLS_DIR,
    publicAssets,
    workspace,
    arcSarArchive: resolveToolPath(config.ARC_SAR),
    arcSar,
    input: path.join(workspace, 'input'),
    inputX2: path.join(workspace, 'input_x2'),
    convertScriptsTool: path.join(TOOLS_DIR, 'helpers', 'convert-scripts'),
    sceneAttrs: path.join(REPO_DIR, 'src', 'assets', 'game', 'scene_attrs.json'),
    sceneAssets: path.join(REPO_DIR, 'src', 'assets', 'game'),
    staticJp: path.join(publicAssets, 'static', 'jp'),
    images: path.join(publicAssets, 'static', 'jp', 'images'),
    imagesThumb: path.join(publicAssets, 'static', 'jp', 'images_thumb'),
    flowchartSpritesheets: path.join(publicAssets, 'res', 'flowchart-spritesheets'),
    wave: path.join(publicAssets, 'static', 'jp', 'wave'),
    cds,
  }
}
