// ===================================================================
// SuperZion sprite generator — Nano Banana (gemini-2.5-flash-image)
//
//   node generate.js hero      # generate the 8 hero sprites
//   node generate.js bosses    # generate the boss sprites
//   node generate.js hero bm_player_down_0   # just one sprite
//
// Needs env var GEMINI_API_KEY. Outputs:
//   raw/<name>.png        -> exactly what the model returned (kept for debugging)
//   ../../superzion-kaplay/public/sprites/<name>.png  -> game-ready, transparent
// ===================================================================

import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SPRITES, KEY_COLOR } from "./prompts.js";
import { postProcess, postProcessBg } from "./postprocess.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dir, "raw");
const OUT_DIR = join(__dir, "..", "..", "superzion", "public", "assets", "sprites");
const MODEL = "gemini-2.5-flash-image";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("\n❌ Falta GEMINI_API_KEY. Conseguila en https://aistudio.google.com/apikey");
  console.error('   Luego: setx GEMINI_API_KEY "tu_key"  (y reiniciá la terminal)\n');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Parse chroma key color to RGB.
const KR = parseInt(KEY_COLOR.slice(1, 3), 16);
const KG = parseInt(KEY_COLOR.slice(3, 5), 16);
const KB = parseInt(KEY_COLOR.slice(5, 7), 16);

// ── Call the model, optionally with a reference image for consistency ──
async function callModel(prompt, refPath, aspect) {
  const parts = [{ text: prompt }];
  if (refPath && existsSync(refPath)) {
    const data = await readFile(refPath);
    parts.push({
      text: "Keep the SAME character design, colors and proportions as this reference image:",
    });
    parts.push({ inlineData: { mimeType: "image/png", data: data.toString("base64") } });
  }

  const req = {
    model: MODEL,
    contents: [{ role: "user", parts }],
  };
  if (aspect) req.config = { imageConfig: { aspectRatio: aspect } };

  const res = await ai.models.generateContent(req);

  const cand = res?.candidates?.[0];
  const imgPart = cand?.content?.parts?.find((p) => p.inlineData?.data);
  if (!imgPart) {
    const txt = cand?.content?.parts?.map((p) => p.text).filter(Boolean).join(" ");
    throw new Error("El modelo no devolvió imagen. Respuesta: " + (txt || "vacía"));
  }
  return Buffer.from(imgPart.inlineData.data, "base64");
}

async function run() {
  const [, , group, only] = process.argv;
  if (!group || !SPRITES[group]) {
    console.error("Uso: node generate.js <hero|bosses> [nombre_sprite_opcional]");
    process.exit(1);
  }

  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  let jobs = SPRITES[group];
  if (only && only !== "--rest") jobs = jobs.filter((j) => j.name === only);
  // --rest = skip sprites whose raw already exists (resume / don't re-pay).
  if (only === "--rest") jobs = jobs.filter((j) => !existsSync(join(RAW_DIR, `${j.name}.png`)));

  for (const job of jobs) {
    process.stdout.write(`🎨 ${job.name} ... `);
    try {
      const refPath = job.ref ? join(RAW_DIR, `${job.ref}.png`) : null;
      const rawBuf = await callModel(job.prompt, refPath, job.aspect);
      await writeFile(join(RAW_DIR, `${job.name}.png`), rawBuf);

      const finalBuf = job.bg
        ? await postProcessBg(rawBuf, job.size)
        : await postProcess(rawBuf, job.size, job.key);
      await writeFile(join(OUT_DIR, `${job.name}.png`), finalBuf);
      console.log("✅");
    } catch (err) {
      console.log("❌ " + err.message);
    }
  }

  console.log(`\nListo. PNGs crudos en raw/, finales en superzion-kaplay/public/sprites/`);
}

run();
