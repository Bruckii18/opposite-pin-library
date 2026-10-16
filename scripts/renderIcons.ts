import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

interface IconSource {
  readonly svgPath: string;
  readonly sizes: readonly number[];
}

interface IconRender {
  readonly fileName: string;
  readonly svg: string;
  readonly size: number;
}

const ICON_SOURCES: readonly IconSource[] = [
  { svgPath: 'assets/icon/logo-small.svg', sizes: [16, 32] },
  { svgPath: 'assets/icon/logo.svg', sizes: [48, 128] },
];
const OUTPUT_DIR = resolve('public/icons');
const DEFAULT_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const RENDER_BUDGET_MS = 3_000;
const MAX_DOM_BYTES = 16 * 1024 * 1024;
const RENDERED_ICON_PATTERN = /<pre data-file="([^"]+)">data:image\/png;base64,([^<]+)<\/pre>/g;

function collectRenders(): IconRender[] {
  return ICON_SOURCES.flatMap(({ svgPath, sizes }) => {
    const svg = readFileSync(resolve(svgPath), 'utf8');
    return sizes.map((size) => ({ fileName: `icon-${size}.png`, svg, size }));
  });
}

function renderPageHtml(renders: readonly IconRender[]): string {
  return `<!doctype html><body><script>
    const renders = ${JSON.stringify(renders)};
    for (const { fileName, svg, size } of renders) {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        canvas.getContext('2d').drawImage(image, 0, 0, size, size);
        const output = document.createElement('pre');
        output.dataset.file = fileName;
        output.textContent = canvas.toDataURL('image/png');
        document.body.append(output);
      };
      image.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    }
  </script></body>`;
}

function dumpRenderedDom(htmlPath: string, workDir: string): string {
  const chromePath = process.env.CHROME_PATH ?? DEFAULT_CHROME_PATH;
  return execFileSync(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      `--user-data-dir=${join(workDir, 'profile')}`,
      `--virtual-time-budget=${RENDER_BUDGET_MS}`,
      '--dump-dom',
      `file://${htmlPath}`,
    ],
    { encoding: 'utf8', maxBuffer: MAX_DOM_BYTES, stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function writeRenderedIcons(dom: string, expectedCount: number): void {
  const renderedIcons = [...dom.matchAll(RENDERED_ICON_PATTERN)];
  if (renderedIcons.length !== expectedCount) {
    throw new Error(`Expected ${expectedCount} rendered icons but Chrome returned ${renderedIcons.length}.`);
  }
  for (const [, fileName = '', base64Png = ''] of renderedIcons) {
    writeFileSync(join(OUTPUT_DIR, fileName), Buffer.from(base64Png, 'base64'));
    console.log(`Wrote public/icons/${fileName}`);
  }
}

const renders = collectRenders();
const workDir = mkdtempSync(join(tmpdir(), 'opposite-pin-icons-'));
try {
  const htmlPath = join(workDir, 'render.html');
  writeFileSync(htmlPath, renderPageHtml(renders));
  writeRenderedIcons(dumpRenderedDom(htmlPath, workDir), renders.length);
} finally {
  rmSync(workDir, { recursive: true, force: true });
}
