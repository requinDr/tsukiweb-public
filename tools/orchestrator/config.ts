import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath, pathToFileURL } from 'url'

export interface ToolConfig {
  ARC_SAR: string
  WAIFU2X_CAFFE: string
  FFMPEG: string
  PUBLIC: string
  CD_EVERAFTER: string
  CD_ORIGINAL: string
  CD_TSUKIBAKO: string
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
  cds: Record<'CD_everafter' | 'CD_original' | 'CD_tsukibako', CdPaths>
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
  CD_EVERAFTER: './CD_everafter',
  CD_ORIGINAL: './CD_original',
  CD_TSUKIBAKO: './CD_tsukibako',
}

type PartialToolConfig = Partial<ToolConfig>

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
    cds: {
      CD_everafter: {
        input: resolveToolPath(config.CD_EVERAFTER),
        output: path.join(publicAssets, 'static', 'jp', 'CD_everafter'),
      },
      CD_original: {
        input: resolveToolPath(config.CD_ORIGINAL),
        output: path.join(publicAssets, 'static', 'jp', 'CD_original'),
      },
      CD_tsukibako: {
        input: resolveToolPath(config.CD_TSUKIBAKO),
        output: path.join(publicAssets, 'static', 'jp', 'CD_tsukibako'),
      },
    },
  }
}
