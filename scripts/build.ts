import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { build, type InlineConfig } from 'vite';

const OUT_DIR = resolve('dist');
const isWatchMode = process.argv.includes('--watch');

interface ContentScriptEntry {
  readonly outputName: string;
  readonly sourcePath: string;
}

const CONTENT_SCRIPT_ENTRIES: readonly ContentScriptEntry[] = [
  { outputName: 'content-script', sourcePath: 'src/content/contentScript.ts' },
  { outputName: 'page-bridge', sourcePath: 'src/content/pageBridge.ts' },
];

function extensionPagesConfig(): InlineConfig {
  return {
    configFile: false,
    root: resolve('src'),
    publicDir: resolve('public'),
    plugins: [react()],
    build: {
      outDir: OUT_DIR,
      emptyOutDir: false,
      modulePreload: { polyfill: false },
      watch: isWatchMode ? {} : null,
      rolldownOptions: {
        input: {
          sidepanel: resolve('src/sidepanel.html'),
          'service-worker': resolve('src/background/serviceWorker.ts'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
  };
}

function contentScriptConfig(entry: ContentScriptEntry): InlineConfig {
  return {
    configFile: false,
    publicDir: false,
    build: {
      outDir: OUT_DIR,
      emptyOutDir: false,
      watch: isWatchMode ? {} : null,
      rolldownOptions: {
        input: resolve(entry.sourcePath),
        output: { format: 'iife', entryFileNames: `${entry.outputName}.js` },
      },
    },
  };
}

await rm(OUT_DIR, { recursive: true, force: true });
await build(extensionPagesConfig());
for (const entry of CONTENT_SCRIPT_ENTRIES) {
  await build(contentScriptConfig(entry));
}
