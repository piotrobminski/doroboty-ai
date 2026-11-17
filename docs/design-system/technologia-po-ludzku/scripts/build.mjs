import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { referenceFiles } from './reference-files.mjs';
const root = new URL('../', import.meta.url);
const out = new URL('dist/', root);
// This generated directory is the only deletion target.
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of referenceFiles) await cp(new URL(name, root), new URL(name, out), { recursive: true });
console.log(`Built reference: ${fileURLToPath(out)}`);
