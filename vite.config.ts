import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// List assets files to use from local instead of fetching from remote
const localAssets = globToRegex([
	'logic.txt',
	'languages.json',
	'game.json',
	'lang.json',
	// 'scenes/*.txt',
])

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
		proxy: {
			'/static': {
				target: `https://tsukidev.holofield.fr/static`,
				changeOrigin: true,
				bypass: (req, res, options) => {
					if (req.url && localAssets.some(r => r.test(req.url!))) {
						// console.log(`Bypass proxy: ${req.url}`)
						return req.url
					}
				},
				rewrite: (path) => path.replace(/^\/static/, '')
			}
		}
	}
})


function globToRegex(patterns: string[]): RegExp[] {
	return patterns.map(pattern => {
		const escaped = pattern
			.replace(/[.+^${}()|[\]\\]/g, '\\$&')
			.replace(/\*/g, '.*')
		return new RegExp(`.*/${escaped}(\\?.*)?$`)
	})
}