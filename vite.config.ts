import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';

// List assets files to use from local instead of fetching from remote
const regexPatterns = globToRegex([
	'languages.json',
	'game.json',
	'lang.json',
	// 'scenes/*.txt',
])

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		viteTsconfigPaths(),
		svgrPlugin()
	],
	define: {
		'process.env': {}
	},
	server: {
		proxy: {
			'/static': {
				target: `https://tsukidev.holofield.fr/static`,
				changeOrigin: true,
				bypass: (req, res, options) => {
					if (req.url && regexPatterns.some(r => r.test(req.url!))) {
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