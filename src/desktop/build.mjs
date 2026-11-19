import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const configScript = html.match(/<script>\s*(tailwind\.config\s*=[\s\S]*?)<\/script>/)?.[1];
if (!configScript) throw new Error('Tailwind theme was not found');
const theme = { tailwind: {} };
vm.runInNewContext(configScript, theme);
await build({
  configFile: false, root, base: './',
  plugins: [
    { name: 'offline-desktop', enforce: 'pre',
      resolveId(source) {
        if (/\/firebaseService$/.test(source)) return path.join(here, 'localService.ts').replaceAll('\\', '/');
        if (/\/firebase$/.test(source)) return path.join(here, 'localAuth.ts').replaceAll('\\', '/');
        if (source === '@vercel/analytics/react') return path.join(here, 'noAnalytics.ts').replaceAll('\\', '/');
      },
      generateBundle() {
        for (const id of this.getModuleIds()) {
          if (/node_modules\/(?:@firebase|firebase|@vercel\/analytics)\//.test(id.replaceAll('\\', '/'))) throw new Error(`Cloud dependency in desktop renderer: ${id}`);
        }
      },
      load(id) {
        if (id === path.join(root, 'index.css').replaceAll('\\', '/')) return fs.readFileSync(id, 'utf8').replace(/@import\s+url\([^)]*\)\s*;/g, '');
      },
      transformIndexHtml: { order: 'pre', handler(source) {
        return source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
          .replace('</head>', `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https: http:; font-src 'self' data:; connect-src 'self' http: https: ws: wss:; object-src 'none'; base-uri 'none'; frame-src 'self' blob:;">\n</head>`)
          .replace('</body>', '<script type="module" src="/src/desktop/entry.ts"></script></body>');
      } }
    }, react()
  ],
  css: { postcss: { plugins: [tailwind({ ...theme.tailwind.config, content: ['App.tsx', 'constants.tsx', 'components/**/*.{ts,tsx}', 'screens/**/*.{ts,tsx}', 'contexts/**/*.{ts,tsx}', 'src/desktop/*.{ts,tsx}'].map(p => path.join(root, p).replaceAll('\\', '/')) }), autoprefixer()] } },
  build: { outDir: path.join(here, 'renderer'), emptyOutDir: true, chunkSizeWarningLimit: 2500 },
  define: { 'process.env.API_KEY': 'undefined', 'process.env.GEMINI_API_KEY': 'undefined' }
});
// Fail the build if cloud runtime dependencies leak into the desktop bundle.
const builtHtml = fs.readFileSync(path.join(here, 'renderer/index.html'), 'utf8');
if (/<script[^>]+https?:/i.test(builtHtml)) throw new Error('Remote script in desktop output');
console.log('Offline desktop renderer built.');
