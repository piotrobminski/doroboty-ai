import { build } from "vite";
import { builtinModules } from "node:module";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "artifacts/production");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "doroboty-production-build-"));
const release = path.join(temporary, "doroboty-ai");
const hash = (data) => createHash("sha256").update(data).digest("hex");
try {
  fs.mkdirSync(release);
  const result = await build({
    configFile: false,
    root,
    publicDir: false,
    ssr: { noExternal: true },
    build: {
      ssr: path.join(root, "server/production-entry.ts"),
      target: "node24",
      outDir: release,
      emptyOutDir: false,
      sourcemap: false,
      rollupOptions: { output: { entryFileNames: "server.mjs", inlineDynamicImports: true } },
    },
  });
  const chunks = Array.isArray(result) ? result.flatMap((item) => item.output) : result.output;
  for (const chunk of chunks) {
    if (chunk.type !== "chunk") continue;
    if (chunk.imports.some((name) => !name.startsWith("node:") && !builtinModules.includes(name)))
      throw new Error("The server bundle still requires an external dependency.");
  }
  fs.cpSync(path.join(root, "dist"), path.join(release, "public"), {
    recursive: true,
    dereference: false,
  });
  fs.copyFileSync(path.join(root, "docs/DEPLOYMENT.md"), path.join(release, "README.md"));
  fs.copyFileSync(path.join(root, "node_modules/zod/LICENSE"), path.join(release, "ZOD-LICENSE"));
  fs.writeFileSync(path.join(release, ".nvmrc"), "24\n");
  fs.writeFileSync(
    path.join(release, "package.json"),
    JSON.stringify(
      {
        name: "doroboty-ai-production",
        version: JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version,
        private: true,
        type: "module",
        engines: { node: ">=24 <25" },
        scripts: { start: "node server.mjs" },
      },
      null,
      2,
    ) + "\n",
  );
  const files = {};
  function inventory(folder, prefix = "") {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const name = `${prefix}${entry.name}`;
      const absolute = path.join(folder, entry.name);
      if (
        entry.isSymbolicLink() ||
        (entry.name.startsWith(".") && name !== ".nvmrc") ||
        /\.(?:sqlite3?|db)(?:[.-].*)?$/i.test(name) ||
        ["node_modules", "source", "src", "server", "tests", "docs"].includes(entry.name)
      )
        throw new Error(`Unexpected private/source entry in production package: ${name}`);
      if (entry.isDirectory()) inventory(absolute, `${name}/`);
      else files[name] = hash(fs.readFileSync(absolute));
    }
  }
  inventory(release);
  if (!files["public/index.html"] || !files["server.mjs"])
    throw new Error("Production build is incomplete.");
  fs.writeFileSync(
    path.join(release, "manifest.json"),
    JSON.stringify({ version: 1, node: 24, stage: "baseline", files }, null, 2) + "\n",
  );
  const archive = path.join(temporary, "doroboty-ai-production.tar.gz");
  execFileSync(
    "tar",
    [
      ...(process.platform === "darwin"
        ? ["--no-mac-metadata", "--uid", "0", "--gid", "0", "--uname", "root", "--gname", "root"]
        : ["--owner=0", "--group=0"]),
      "--no-xattrs",
      "-czf",
      archive,
      "-C",
      temporary,
      "doroboty-ai",
    ],
    { env: { ...process.env, COPYFILE_DISABLE: "1" } },
  );
  fs.mkdirSync(output, { recursive: true });
  fs.copyFileSync(archive, path.join(output, path.basename(archive)));
  fs.writeFileSync(
    path.join(output, "doroboty-ai-production.tar.gz.sha256"),
    `${hash(fs.readFileSync(archive))}  doroboty-ai-production.tar.gz\n`,
  );
  console.log(`Production archive: ${path.join(output, path.basename(archive))}`);
  console.log(`Contains ${Object.keys(files).length} files; runtime: Node.js 24, no npm install.`);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
