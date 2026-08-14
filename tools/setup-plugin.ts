import fs from 'node:fs/promises'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'

import { directoryHasFiles, displayPath, ensureDir, pathExists } from '@tsukiweb/common/tools/utils/fs-utils.ts'
import { logger, type LogEvent } from '@tsukiweb/common/tools/utils/logger.ts'
import { collectStatuses } from '@tsukiweb/common/tools/orchestrator/ui.ts'
import type { Check, OrchestratorStep } from '@tsukiweb/common/tools/orchestrator/utils.ts'
import { resolveExecutable } from '@tsukiweb/common/tools/utils/process-utils.ts'
import { buildPaths, CONFIG_PATH, loadConfig, REPO_DIR, type ToolConfig } from './orchestrator/config.ts'
import { buildPaths as buildPdPaths } from './orchestrator/pd-config.ts'
import { createSteps } from './orchestrator/steps.ts'
import { createSteps as createPdSteps } from './orchestrator/pd-steps.ts'

const BODY_LIMIT = 16 * 1024
const JOURNAL_LIMIT = 500
const DOWNLOAD_URLS = {
  ffmpeg: 'https://www.ffmpeg.org/download.html',
  waifu2x: 'https://github.com/lltcggie/waifu2x-caffe/releases',
}

type PipelineId = 'main' | 'pd'

type RunningStep = {
  pipeline: PipelineId
  stepId: number
  title: string
}

type SetupEvent = {
  id: number
  timestamp: string
  type: LogEvent['type'] | 'step-started' | 'step-finished'
  text?: string
  key?: string
  pipeline?: PipelineId
  stepId?: number
  result?: 'success' | 'error' | 'incomplete'
}

export class HttpError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

export class ExecutionLock<T> {
  current: T | null = null

  acquire(value: T): void {
    if (this.current) throw new HttpError(409, 'Another step is already running.', this.current)
    this.current = value
  }

  release(): void {
    this.current = null
  }
}

export async function executeOrchestratorStep(step: OrchestratorStep): Promise<{
  result: 'success' | 'incomplete'
  done: Check
}> {
  await step.run()
  const done = await step.isDone()
  return { result: done.ok ? 'success' : 'incomplete', done }
}

export function validateConfig(value: unknown): ToolConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new HttpError(400, 'Configuration must be an object.')
  }

  const input = value as Record<string, unknown>
  const config = {} as ToolConfig
  for (const key of ['WAIFU2X_CAFFE', 'FFMPEG', 'PUBLIC'] as const) {
    const field = input[key]
    if (typeof field !== 'string' || !field.trim() || field.length > 4096) {
      throw new HttpError(400, `${key} must be a non-empty string.`)
    }
    config[key] = field.trim()
  }
  return config
}

export function serializeConfig(config: ToolConfig, eol = '\n', finalNewline = true): string {
  const lines = [
    '// Relative paths are resolved from the tools/ directory.',
    'export default {',
    `  WAIFU2X_CAFFE: ${JSON.stringify(config.WAIFU2X_CAFFE)},`,
    `  FFMPEG: ${JSON.stringify(config.FFMPEG)},`,
    '',
    `  PUBLIC: ${JSON.stringify(config.PUBLIC)},`,
    '}',
  ]
  return lines.join(eol) + (finalNewline ? eol : '')
}

async function saveConfig(config: ToolConfig): Promise<void> {
  let current = ''
  try {
    current = await fs.readFile(CONFIG_PATH, 'utf8')
  } catch (error) {
    if (!(typeof error === 'object' && error && 'code' in error && error.code === 'ENOENT')) throw error
  }

  const eol = current.includes('\r\n') ? '\r\n' : '\n'
  const finalNewline = !current || current.endsWith('\n')
  await fs.writeFile(CONFIG_PATH, serializeConfig(config, eol, finalNewline), 'utf8')
}

async function createContext() {
  const config = await loadConfig()
  const mainPaths = buildPaths(config)
  const pdPaths = buildPdPaths(config)

  await Promise.all([
    ensureDir(mainPaths.workspace),
    ensureDir(pdPaths.workspace),
    ...Object.values(mainPaths.cds).map(dirs => ensureDir(dirs.input)),
  ])

  return {
    config,
    main: { paths: mainPaths, steps: createSteps({ config, paths: mainPaths }) },
    pd: { paths: pdPaths, steps: createPdSteps({ config, paths: pdPaths }) },
  }
}

function failedDetails(check: Awaited<ReturnType<typeof collectStatuses>>[number]['canRun']) {
  return check.details.filter(detail => !detail.ok).map(detail => detail.failure)
}

async function pipelineState(id: PipelineId, title: string, steps: ReturnType<typeof createSteps>) {
  const statuses = await collectStatuses(steps)
  return {
    id,
    title,
    steps: statuses.map(({ step, canRun, done }) => ({
      id: step.id,
      title: step.title,
      canRun: canRun.ok,
      done: done.ok,
      blockedBy: failedDetails(canRun),
      incomplete: failedDetails(done),
    })),
  }
}

async function setupState(running: RunningStep | null, journal: SetupEvent[], lastResult: SetupEvent | null) {
  const context = await createContext()
  const ffmpeg = await resolveExecutable(context.config.FFMPEG, context.main.paths.tools)
  const waifu2x = await resolveExecutable(context.config.WAIFU2X_CAFFE, context.main.paths.tools)
  const nscript = path.join(context.main.paths.tools, 'nscript.dat')

  return {
    config: context.config,
    running,
    lastResult,
    journal,
    tools: [
      {
        id: 'ffmpeg',
        label: 'FFmpeg',
        configuredValue: context.config.FFMPEG,
        found: ffmpeg.found,
        resolvedPath: ffmpeg.found ? displayPath(ffmpeg.command, REPO_DIR) : null,
        downloadUrl: DOWNLOAD_URLS.ffmpeg,
      },
      {
        id: 'waifu2x',
        label: 'waifu2x-caffe',
        configuredValue: context.config.WAIFU2X_CAFFE,
        found: waifu2x.found,
        resolvedPath: waifu2x.found ? displayPath(waifu2x.command, REPO_DIR) : null,
        downloadUrl: DOWNLOAD_URLS.waifu2x,
      },
    ],
    sources: [
      {
        id: 'arc',
        pipeline: 'main',
        label: 'arc.sar',
        path: displayPath(context.main.paths.arcArchive, REPO_DIR),
        found: await pathExists(context.main.paths.arcArchive),
        optional: false,
        kind: 'file' as const,
      },
      {
        id: 'nscript',
        pipeline: 'main',
        label: 'nscript.dat',
        path: displayPath(nscript, REPO_DIR),
        found: await pathExists(nscript),
        optional: false,
        kind: 'file' as const,
      },
      ...await Promise.all(Object.entries(context.main.paths.cds).map(async ([name, dirs]) => ({
        id: name,
        pipeline: 'main' as const,
        label: name,
        path: displayPath(dirs.input, REPO_DIR),
        found: await directoryHasFiles(dirs.input),
        optional: true,
        kind: 'directory' as const,
      }))),
      {
        id: 'data',
        pipeline: 'pd',
        label: 'data.xp3',
        path: displayPath(context.pd.paths.dataArchive, REPO_DIR),
        found: await pathExists(context.pd.paths.dataArchive),
        optional: false,
        kind: 'file' as const,
      },
    ],
    pipelines: [
      await pipelineState('main', 'Main game', context.main.steps),
      await pipelineState('pd', 'Plus-Disc', context.pd.steps as ReturnType<typeof createSteps>),
    ],
  }
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  if (!req.headers['content-type']?.startsWith('application/json')) {
    throw new HttpError(415, 'Content-Type must be application/json.')
  }

  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > BODY_LIMIT) throw new HttpError(413, 'Request body is too large.')
    chunks.push(buffer)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'Request body must contain valid JSON.')
  }
}

function sendJson(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  })
  res.end(JSON.stringify(value))
}

function assertSameOrigin(req: IncomingMessage): void {
  const origin = req.headers.origin
  const host = req.headers.host
  let originHost = ''
  try {
    originHost = origin ? new URL(origin).host : ''
  } catch {
    throw new HttpError(403, 'Request origin is not allowed.')
  }
  if (!originHost || !host || originHost !== host) {
    throw new HttpError(403, 'Request origin is not allowed.')
  }
}

function errorResponse(res: ServerResponse, error: unknown): void {
  if (error instanceof HttpError) {
    sendJson(res, error.status, { error: error.message, details: error.details })
    return
  }
  console.error(error)
  sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
}

export function setupPlugin(): Plugin {
  const execution = new ExecutionLock<RunningStep>()
  let lastResult: SetupEvent | null = null
  let eventId = 0
  let journal: SetupEvent[] = []
  const clients = new Set<ServerResponse>()

  const publish = (event: Omit<SetupEvent, 'id' | 'timestamp'>) => {
    const entry: SetupEvent = {
      ...event,
      id: ++eventId,
      timestamp: new Date().toISOString(),
    }
    journal.push(entry)
    if (journal.length > JOURNAL_LIMIT) journal = journal.slice(-JOURNAL_LIMIT)
    const payload = `id: ${entry.id}\ndata: ${JSON.stringify(entry)}\n\n`
    for (const client of clients) client.write(payload)
    return entry
  }

  const runStep = async (
    pipeline: PipelineId,
    step: ReturnType<typeof createSteps>[number],
  ) => {
    publish({ type: 'clear' })
    publish({ type: 'step-started', text: `Starting ${step.title}`, pipeline, stepId: step.id })
    let result: SetupEvent['result'] = 'error'

    try {
      const executionResult = await executeOrchestratorStep(step)
      result = executionResult.result
      const text = executionResult.done.ok
        ? `${step.title} completed successfully.`
        : `${step.title} finished, but its completion checks failed.`
      lastResult = publish({ type: executionResult.done.ok ? 'log' : 'error', text, pipeline, stepId: step.id, result })
    } catch (error) {
      lastResult = publish({
        type: 'error',
        text: error instanceof Error ? error.message : String(error),
        pipeline,
        stepId: step.id,
        result,
      })
    } finally {
      execution.release()
      publish({ type: 'step-finished', pipeline, stepId: step.id, result })
    }
  }

  return {
    name: 'tsukiweb-setup-api',
    configureServer(server: ViteDevServer) {
      const unsubscribe = logger.subscribe(event => publish(event))
      server.httpServer?.once('close', unsubscribe)

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`)
        if (!url.pathname.startsWith('/api/setup/')) return next()

        try {
          if (req.method === 'GET' && url.pathname === '/api/setup/state') {
            sendJson(res, 200, await setupState(execution.current, journal, lastResult))
            return
          }

          if (req.method === 'GET' && url.pathname === '/api/setup/events') {
            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              Connection: 'keep-alive',
              'X-Content-Type-Options': 'nosniff',
            })
            res.write(': connected\n\n')
            clients.add(res)
            const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15_000)
            req.once('close', () => {
              clearInterval(heartbeat)
              clients.delete(res)
            })
            return
          }

          if (req.method === 'POST') assertSameOrigin(req)

          if (req.method === 'POST' && url.pathname === '/api/setup/config') {
            if (execution.current) throw new HttpError(409, 'Configuration cannot change while a step is running.')
            const config = validateConfig(await readJson(req))
            await saveConfig(config)
            sendJson(res, 200, await setupState(execution.current, journal, lastResult))
            return
          }

          if (req.method === 'POST' && url.pathname === '/api/setup/run') {
            const body = await readJson(req)
            if (!body || typeof body !== 'object' || Array.isArray(body)) {
              throw new HttpError(400, 'Run request must be an object.')
            }
            const { pipeline, stepId } = body as Record<string, unknown>
            if ((pipeline !== 'main' && pipeline !== 'pd') || !Number.isInteger(stepId)) {
              throw new HttpError(400, 'pipeline and stepId are invalid.')
            }

            execution.acquire({ pipeline, stepId: stepId as number, title: 'Preparing step…' })
            try {
              const context = await createContext()
              const steps = pipeline === 'main' ? context.main.steps : context.pd.steps
              const step = steps.find(candidate => candidate.id === stepId)
              if (!step) throw new HttpError(404, 'Step not found.')

              execution.current = { pipeline, stepId: step.id, title: step.title }
              const canRun = await step.canRun()
              if (!canRun.ok) {
                throw new HttpError(409, 'Step prerequisites are not satisfied.', failedDetails(canRun))
              }

              void runStep(pipeline, step)
              sendJson(res, 202, { running: execution.current })
            } catch (error) {
              execution.release()
              throw error
            }
            return
          }

          throw new HttpError(404, 'Setup API route not found.')
        } catch (error) {
          errorResponse(res, error)
        }
      })
    },
  }
}
