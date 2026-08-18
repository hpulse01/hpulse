import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const sourceDir = process.argv[2];
if (!sourceDir) {
  throw new Error('usage: node scripts/install-wasm-artifact.mjs <wasm-pack-output-dir>');
}

const root = process.cwd();
const bindingsDir = path.join(root, 'src/lib/wasm/hpulse-input');
const publicDir = path.join(root, 'public/wasm');
await mkdir(bindingsDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

const sourceJs = path.join(sourceDir, 'hpulse_input.js');
const sourceDts = path.join(sourceDir, 'hpulse_input.d.ts');
const sourceWasm = path.join(sourceDir, 'hpulse_input_bg.wasm');
const generatedJs = await readFile(sourceJs, 'utf8');
const browserJs = generatedJs
  .replace(
    /module_or_path\s*=\s*new URL\(['"]hpulse_input_bg\.wasm['"],\s*import\.meta\.url\);/,
    "module_or_path = '/wasm/hpulse_input_bg.wasm';",
  )
  .replace(
    /module_or_path\s*=\s*['"]\/wasm\/hpulse_input_bg\.wasm['"];/,
    "module_or_path = '/wasm/hpulse_input_bg.wasm';",
  );

if (!browserJs.includes("module_or_path = '/wasm/hpulse_input_bg.wasm';")) {
  throw new Error('wasm-pack loader format changed; refusing to install an unverified binding');
}

await writeFile(path.join(bindingsDir, 'hpulse_input.js'), browserJs);
await copyFile(sourceDts, path.join(bindingsDir, 'hpulse_input.d.ts'));
await copyFile(sourceWasm, path.join(publicDir, 'hpulse_input_bg.wasm'));
