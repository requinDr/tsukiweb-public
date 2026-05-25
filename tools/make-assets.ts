import { ensureDir } from '../tsukiweb-common/tools/utils/fs-utils.ts'
import { createSteps, type Step } from './orchestrator/steps.ts'
import { loadConfig, buildPaths, type Paths } from './orchestrator/config.ts'
import { collectStatuses, createPrompt, printCheckDetails, printStatus } from './orchestrator/ui.ts'
import { logger } from '../tsukiweb-common/tools/utils/logger.ts'

interface OrchestratorContext {
  paths: Paths
  steps: Step[]
}

async function getContext(): Promise<OrchestratorContext> {
  const config = await loadConfig()
  const paths = buildPaths(config)
  await ensureDir(paths.workspace)

  return {
    paths,
    steps: createSteps({ config, paths }),
  }
}

async function runStep(step: Step): Promise<void> {
  const canRun = await step.canRun()

  if (!canRun.ok) {
    console.log(`\nStep ${step.id} is blocked: ${step.title}`)
    printCheckDetails(canRun)
    return
  }

  console.log(`\n--- Step ${step.id}: ${step.title} ---`)
  try {
    logger.clear()
    await step.run()
    logger.clear()
  } catch (error) {
    logger.clear()
    console.error(`\nError while running step ${step.id}:`, error)
    return
  }

  const done = await step.isDone()
  if (done.ok) {
    console.log(`\nStep ${step.id} completed successfully.`)
    return
  }

  console.log(`\nStep ${step.id} finished, but its done condition is not valid.`)
  printCheckDetails(done)
}

function findStep(steps: Step[], value: string): Step | undefined {
  const stepId = Number.parseInt(value, 10)
  return steps.find(step => step.id === stepId)
}

async function runInteractive(): Promise<void> {
  const prompt = createPrompt()
  let context = await getContext()

  try {
    while (true) {
      printStatus(await collectStatuses(context.steps), context.paths)
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
