import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const out = new URL('dist-agent-kit/', root);
// This generated directory is the only deletion target.
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const files = ['index.html', 'styles.css', 'app.js', 'jobs.mjs', 'job-store.mjs', 'job-view.mjs', 'listing-components.mjs', 'job.html', 'job.js', 'create-job.html', 'create-job.js', 'job-pages.css', 'icon-colors.css', 'icon-schemes.mjs', 'icon-directions.html', 'icon-directions.css', 'icon-directions.js', 'ui-examples.html', 'ui-long-content.html', 'package.json', 'README.md', 'assets', 'agent-kit', 'scripts', 'qa'];
for (const name of files) await cp(new URL(name, root), new URL(name, out), { recursive: true });
await mkdir(new URL('docs/design-system/', out), { recursive: true });
await cp(new URL('docs/design-system/v1/', root), new URL('docs/design-system/v1/', out), { recursive: true });
const signatures = {};
for (const name of ['agent-kit/design.md', 'agent-kit/components.md', 'agent-kit/foundation.css', 'listing-components.mjs', 'ui-examples.html', 'ui-long-content.html', 'styles.css', 'job-pages.css', 'icon-colors.css', 'assets/tokens.css']) signatures[name] = createHash('sha256').update(await readFile(new URL(name, root))).digest('hex');
await writeFile(new URL('agent-kit-manifest.json', out), JSON.stringify({ name: 'doroboty-agent-kit', version: '1', generatedAt: new Date().toISOString(), entry: 'agent-kit/design.md', examples: 'ui-examples.html', longContent: 'ui-long-content.html', documentation: 'docs/design-system/v1/index.html', signatures }, null, 2));
console.log(`Agent package: ${fileURLToPath(out)}`);
