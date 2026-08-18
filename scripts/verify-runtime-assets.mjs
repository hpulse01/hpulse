import { readFile } from 'node:fs/promises';
import process from 'node:process';

const wasmPath = new URL('../public/wasm/hpulse_input_bg.wasm', import.meta.url);
let bytes;
try {
  bytes = await readFile(wasmPath);
} catch {
  process.stderr.write('runtime asset gate failed: public/wasm/hpulse_input_bg.wasm is missing\n');
  process.exit(1);
}

const magic = [0x00, 0x61, 0x73, 0x6d];
if (bytes.length < 8 || magic.some((byte, index) => bytes[index] !== byte)) {
  process.stderr.write('runtime asset gate failed: HPU input WASM is not a real WebAssembly binary\n');
  process.exit(1);
}

process.stdout.write(`runtime asset gate passed: ${bytes.length} byte WASM binary\n`);
