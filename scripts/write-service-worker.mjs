import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const staticRoot = join(root, ".next", "static");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  }));
  return nested.flat();
}

const files = await listFiles(staticRoot);
const assets = files
  .filter((path) => /\.(?:js|css)$/.test(path))
  .map((path) => `/_next/static/${relative(staticRoot, path).split(sep).join("/")}`)
  .sort();

const buildId = (await readFile(join(root, ".next", "BUILD_ID"), "utf8")).trim();
const cacheId = createHash("sha256").update(buildId).digest("hex").slice(0, 12);
const template = await readFile(join(root, "scripts", "sw.template.js"), "utf8");
const serviceWorker = template
  .replace("__BUILD_ID__", cacheId)
  .replace("/* __ASSET_JSON__ */ []", JSON.stringify(assets, null, 2));

await writeFile(join(root, "public", "sw.js"), serviceWorker);
if (process.env.NEXT_OUTPUT_EXPORT === "1" || process.env.TAURI_ENV_PLATFORM) {
  await writeFile(join(root, "out", "sw.js"), serviceWorker);
}

console.log(`Service worker ready: ${assets.length} build assets.`);
