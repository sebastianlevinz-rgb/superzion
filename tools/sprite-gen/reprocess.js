// Re-run post-processing on already-downloaded raw/*.png — no API calls.
//   node reprocess.js              # all groups
//   node reprocess.js hero         # one group
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SPRITES } from "./prompts.js";
import { postProcess, postProcessBg } from "./postprocess.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dir, "raw");
const OUT_DIR = join(__dir, "..", "..", "superzion", "public", "assets", "sprites");

const which = process.argv[2];
const groups = which ? [which] : Object.keys(SPRITES);
await mkdir(OUT_DIR, { recursive: true });

for (const g of groups) {
  for (const job of SPRITES[g] || []) {
    const rawPath = join(RAW_DIR, `${job.name}.png`);
    if (!existsSync(rawPath)) continue;
    process.stdout.write(`♻️  ${job.name} ... `);
    try {
      const buf = await readFile(rawPath);
      const out = job.bg ? await postProcessBg(buf, job.size) : await postProcess(buf, job.size, job.key);
      await writeFile(join(OUT_DIR, `${job.name}.png`), out);
      console.log("✅");
    } catch (e) {
      console.log("❌ " + e.message);
    }
  }
}
