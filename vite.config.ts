import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import svgrPlugin from 'vite-plugin-svgr';

const targetFolder = "tsukiweb"
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
  base: process.env.NODE_ENV === 'production' ? `/${targetFolder}/` : '/',
  server: {
    proxy: {
      '/static': {
        target: `https://holofield.fr/${targetFolder}/static`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/static/, '')
      }
    }
  }
});