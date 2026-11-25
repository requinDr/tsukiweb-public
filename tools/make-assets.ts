import { displayPath, ensureDir } from '@tsukiweb/common/tools/utils/fs-utils.ts'
import { runOrchestrator } from '@tsukiweb/common/tools/orchestrator/runner.ts'
import { createSteps } from './orchestrator/steps.ts'
import { buildPaths, createTools } from './orchestrator/config.ts'

await runOrchestrator({
  title: 'Tsukiweb asset builder',
  subtitle: 'Usage: node make-assets.ts [game folder] [--all]',
  load: async () => {
    const paths = buildPaths()
    const tools = createTools()
    await ensureDir(paths.workspace)

    return {
      fields: [
        { label: 'Game', value: displayPath(paths.arcArchive) },
        { label: 'Workspace', value: displayPath(paths.workspace) },
        { label: 'Final output', value: displayPath(paths.publicAssets) },
      ],
      tools: Object.values(tools),
      steps: createSteps({ tools, paths }),
    }
  },
})
