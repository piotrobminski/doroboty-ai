import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { referenceFiles } from './reference-files.mjs';
const root = new URL('../', import.meta.url);
const out = new URL('dist-agent-kit/', root);
// This generated directory is the only deletion target.
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of referenceFiles) await cp(new URL(name, root), new URL(name, out), { recursive: true });
const source = JSON.parse(await readFile(new URL('agent-kit-manifest.json', root), 'utf8'));
const signatures = {};
for (const name of Object.keys(source.signatures)) signatures[name] = createHash('sha256').update(await readFile(new URL(name, root))).digest('hex');
await writeFile(new URL('agent-kit-manifest.json', out), JSON.stringify({ ...source, generatedAt: new Date().toISOString(), signatures }, null, 2)+'\n');
console.log(`Agent package: ${fileURLToPath(out)}`);
