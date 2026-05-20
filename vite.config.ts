import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
export default defineConfig({
	plugins: [
		react(),
	],
	resolve: {
		tsconfigPaths: true
	},
	build: {
		chunkSizeWarningLimit: 1000,
	},
	server: {
		proxy: proxyRules
	}
})