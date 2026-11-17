import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const out = new URL('dist/', root);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'jobs.mjs', 'job-store.mjs', 'job-view.mjs', 'job.html', 'job.js', 'create-job.html', 'create-job.js', 'job-pages.css', 'icon-colors.css', 'icon-schemes.mjs', 'icon-directions.html', 'icon-directions.css', 'icon-directions.js', 'listing-components.mjs', 'assets']) await cp(new URL(name, root), new URL(name, out), { recursive: true });
console.log(`Built: ${fileURLToPath(out)}`);
