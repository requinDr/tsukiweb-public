import { displayPath, ensureDir } from '@tsukiweb/common/tools/utils/fs-utils.ts'
import { runOrchestrator } from '@tsukiweb/common/tools/orchestrator/runner.ts'
import { createSteps } from './orchestrator/pd-steps.ts'
import { createTools } from './orchestrator/config.ts'
import { buildPaths } from './orchestrator/pd-config.ts'

await runOrchestrator({
  title: 'Tsukiweb Plus-Disc asset builder',
  subtitle: 'Usage: node pd-make-assets.ts [Plus-Disc folder] [--all]',
  load: async () => {
    const paths = buildPaths()
    const tools = createTools()
    await ensureDir(paths.workspace)

    return {
      fields: [
        { label: 'Game', value: displayPath(paths.dataArchive) },
        { label: 'Workspace', value: displayPath(paths.workspace) },
        { label: 'Final output', value: displayPath(paths.publicAssets) },
      ],
      tools: Object.values(tools),
      steps: createSteps({ tools, paths }),
    }
  },
})
