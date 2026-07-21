import { displayPath, ensureDir } from '@tsukiweb/common/tools/utils/fs-utils.ts'
import type { Check, OrchestratorStep } from '@tsukiweb/common/tools/orchestrator/utils.ts'
import { createSteps } from './orchestrator/steps.ts'
import { loadConfig, buildPaths, type Paths, type ToolConfig } from './orchestrator/config.ts'
import {
  collectStatuses,
  createPrompt,
  printCheckDetails,
  type StepStatus,
} from '@tsukiweb/common/tools/orchestrator/ui.ts'
import { printOrchestratorHeader } from '@tsukiweb/common/tools/orchestrator/header.ts'
import { logger } from '@tsukiweb/common/tools/utils/logger.ts'
import { formatDuration } from '@tsukiweb/common/tools/utils/utils.ts'

interface OrchestratorContext {
  config: ToolConfig
  paths: Paths
  steps: OrchestratorStep[]
}

const DOWNLOAD_URLS = {
  ffmpeg: 'https://www.ffmpeg.org/download.html',
  waifu2x: 'https://github.com/lltcggie/waifu2x-caffe/releases',
}

function firstFailure(check: Check): string {
  const failure = check.details.find(detail => !detail.ok)?.failure
  if (!failure) return ''
  return typeof failure === 'string' ? failure : `${failure.target} is ${failure.state}`
}

async function getContext(): Promise<OrchestratorContext> {
  const config = await loadConfig()
  const paths = buildPaths(config)
  await ensureDir(paths.workspace)
  await Promise.all(Object.values(paths.cds).map(dirs => ensureDir(dirs.input)))

  return {
    config,
    paths,
    steps: createSteps({ config, paths }),
  }
}

async function printStatus(statuses: StepStatus[], context: OrchestratorContext): Promise<void> {
  await printOrchestratorHeader({
    title: 'Tsukiweb asset builder',
    subtitle: 'Run the steps in order, one at a time.',
    fields: [
      { label: 'Workspace', value: displayPath(context.paths.workspace) },
      { label: 'Final output', value: displayPath(context.paths.publicAssets) },
    ],
    paths: {
      repo: context.paths.repo,
      tools: context.paths.tools,
    },
    tools: [
      { label: 'ffmpeg', configuredValue: context.config.FFMPEG, downloadUrl: DOWNLOAD_URLS.ffmpeg },
      { label: 'waifu2x', configuredValue: context.config.WAIFU2X_CAFFE, downloadUrl: DOWNLOAD_URLS.waifu2x },
    ],
  })

  const headings = ['Steps', 'Runnable', 'Finished', 'Details']
  const rows = statuses.map(({ step, canRun, done }) => [
    `${step.id}. ${step.title}`,
    canRun.ok ? 'Yes' : 'No',
    done.ok ? 'Yes' : 'No',
    firstFailure(canRun.ok ? done : canRun),
  ])
  const widths = headings.map((heading, index) =>
    Math.max(heading.length, ...rows.map(row => row[index].length))
  )

  console.log(headings.map((heading, index) =>
    `\x1b[4m${heading}\x1b[0m${' '.repeat(widths[index] - heading.length)}`
  ).join('  '))
  for (const row of rows) {
    console.log(row.map((value, index) => {
      const padded = value.padEnd(widths[index])
      return index === 1 || index === 2
        ? `\x1b[${value === 'Yes' ? 32 : 31}m${padded}\x1b[0m`
        : padded
    }).join('  ').trimEnd())
  }
}

async function runStep(step: OrchestratorStep): Promise<void> {
  const canRun = await step.canRun()

  if (!canRun.ok) {
    console.log(`\nStep ${step.id} is blocked: ${step.title}`)
    printCheckDetails(canRun)
    return
  }

  console.log(`\n\x1b[4mStep ${step.id}: ${step.title}\x1b[0m`)
  const startedAt = performance.now()
  let duration = ''

  try {
    logger.clear()
    await step.run()
    duration = formatDuration(performance.now() - startedAt)
    logger.clear()
  } catch (error) {
    duration = formatDuration(performance.now() - startedAt)
    logger.clear()
    console.error(`\nError while running step ${step.id} after ${duration}:`, error)
    return
  }

  const done = await step.isDone()
  if (done.ok) {
    console.log(`\nStep ${step.id} completed successfully in ${duration}.`)
    return
  }

  console.log(`\nStep ${step.id} finished in ${duration}, but its done condition is not valid.`)
  printCheckDetails(done)
}

function findStep(steps: OrchestratorStep[], value: string): OrchestratorStep | undefined {
  const stepId = Number.parseInt(value, 10)
  return steps.find(step => step.id === stepId)
}

async function runInteractive(): Promise<void> {
  const prompt = createPrompt()
  let context = await getContext()

  try {
    while (true) {
      await printStatus(await collectStatuses(context.steps), context)
      const answer = (await prompt.question(`\nStep to run (1-${context.steps.length}), r=refresh, q=quit: `)).trim().toLowerCase()

      if (!answer) continue
      if (answer === 'r') {
        context = await getContext()
        continue
      }
      if (answer === 'q' || answer === 'quit' || answer === 'exit') break

      const step = findStep(context.steps, answer)
      if (!step) {
        console.log(`Unknown choice: ${answer}`)
        continue
      }

      await runStep(step)
    }
  } finally {
    prompt.close()
  }
}

async function main(): Promise<void> {
  await runInteractive()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
