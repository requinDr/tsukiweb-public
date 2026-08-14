import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { glob, rm } from 'node:fs/promises';
import { setupPlugin } from './tools/setup-plugin.ts';

const serverUrl = 'https://tsukidev.holofield.fr'

// List assets files to use from remote instead of fetching from local
const remotePaths: string[] = [
	'/res/flowchart-spritesheets',
	'^/static/[^/]+/CD_everafter',
	'^/static/[^/]+/CD_original',
	'^/static/[^/]+/CD_tsukibako',
	'^/static/[^/]+/images',
	'^/static/[^/]+/images_thumb',
	'^/static/[^/]+/scenes',
	'^/static/[^/]+/wave',
	'^/static/[^/]+/wave_pd',
]
const proxyRules: Record<string, any> = {}
remotePaths.forEach((path) => {
	proxyRules[path] = {
		target: serverUrl,
		changeOrigin: true,
	}
})

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [
		react(),
		...(mode === 'setup' ? [setupPlugin()] : []),
		{
			name: 'exclude-sources-from-build',
			apply: 'build',
			async closeBundle() {
				for await (const sources of glob('dist/static/*/sources')) {
					await rm(sources, { recursive: true, force: true })
				}
			},
		},
	],
	resolve: {
		tsconfigPaths: true
	},
	build: {
		chunkSizeWarningLimit: 1000,
	},
	server: {
		host: mode === 'setup' ? '127.0.0.1' : undefined,
		proxy: mode === 'proxy' ? proxyRules : {}
	}
}))