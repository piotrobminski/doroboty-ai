import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const folder = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(folder, "../..");
const walk = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
function verify(directory, manifestFile, label) {
  const kit = path.join(folder, directory);
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, manifestFile), "utf8"));
  const actual = walk(kit).map((file) => path.relative(kit, file).split(path.sep).join("/"));
  assert.deepEqual(
    actual.sort(),
    Object.keys(manifest.files).sort(),
    `${label}: inventory changed`,
  );
  for (const [relative, expected] of Object.entries(manifest.files)) {
    const hash = createHash("sha256")
      .update(fs.readFileSync(path.join(kit, relative)))
      .digest("hex");
    assert.equal(hash, expected, `${label}: reference changed: ${relative}`);
  }
  console.log(`${label}: ${actual.length} files match ${manifest.version}.`);
  return manifest;
}
const active = verify(
  "technologia-po-ludzku",
  "technologia-po-ludzku-manifest.json",
  "ACTIVE Technologia po ludzku",
);
verify("agent-kit", "kit-manifest.json", "Legacy compatibility assets (not visual authority)");
const previousRoot = path.join(folder, "history/technologia-po-ludzku-v1-originals");
const previous = JSON.parse(fs.readFileSync(path.join(previousRoot, "manifest.json"), "utf8"));
for (const [relative, expected] of Object.entries(previous.files)) {
  const archived = path.join(previousRoot, "files", relative);
  const source = fs.existsSync(archived)
    ? archived
    : path.join(folder, "technologia-po-ludzku", relative);
  assert.equal(
    createHash("sha256").update(fs.readFileSync(source)).digest("hex"),
    expected,
    `Preserved v1 reconstruction changed: ${relative}`,
  );
}
console.log(`Preserved v1: all ${Object.keys(previous.files).length} original hashes reconstruct.`);
for (const relative of [
  "package.json",
  "agent-kit-manifest.json",
  "agent-kit/host-profiles.json",
]) {
  const metadata = JSON.parse(
    fs.readFileSync(path.join(folder, "technologia-po-ludzku", relative), "utf8"),
  );
  assert.equal(metadata.version, active.version, `${relative}: release version drift`);
}
const entry = "docs/design-system/technologia-po-ludzku/agent-kit/design.md";
for (const name of ["AGENTS.md", "README.md", "CLAUDE.md", "GUI.md"]) {
  assert.ok(
    fs.readFileSync(path.join(root, name), "utf8").includes(entry),
    `${name} must point to the active agent entry`,
  );
}
console.log("Root instructions point to the active local design system.");
