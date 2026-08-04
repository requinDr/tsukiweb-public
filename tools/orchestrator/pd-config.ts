import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath, pathToFileURL } from 'url'

export interface ToolConfig {
  WAIFU2X_CAFFE: string
  FFMPEG: string
  PUBLIC: string
}

export interface Paths {
  tools: string
  publicAssets: string
  workspace: string
  dataArchive: string
  img: string
  imgX2: string
  images: string
  imagesThumb: string
  wave: string
}

export const ORCHESTRATOR_DIR = path.dirname(fileURLToPath(import.meta.url))
export const TOOLS_DIR = path.resolve(ORCHESTRATOR_DIR, '..')
export const REPO_DIR = path.resolve(TOOLS_DIR, '..')
export const CONFIG_PATH = path.join(TOOLS_DIR, 'my-config.ts')

const DEFAULT_CONFIG: ToolConfig = {
  WAIFU2X_CAFFE: 'waifu2x-caffe-cui.exe',
  FFMPEG: 'ffmpeg.exe',
  PUBLIC: '../public',
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
  const workspace = path.join(TOOLS_DIR, '_workspace_pd')
  const img = path.join(workspace, 'img')
  const imgX2 = path.join(workspace, 'img_x2')
  const images = path.join(publicAssets, 'static', 'jp', 'images')

  return {
    tools: TOOLS_DIR,
    publicAssets,
    workspace,
    dataArchive: path.join(TOOLS_DIR, 'data.xp3'),
    img,
    imgX2,

    //output
    images,
    imagesThumb: path.join(publicAssets, 'static', 'jp', 'images_thumb'),
    wave: path.join(publicAssets, 'static', 'jp', 'wave_pd'),
  }
}
