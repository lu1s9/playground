#!/usr/bin/env node
// ============================================================
// generate-audio.js
// Genera los MP3 de cada lectura usando Google Cloud TTS.
// Solo lo corres una vez (o cuando agregues/modifiques textos).
//
// Requisitos:
//   - Node 18+ (fetch nativo)
//   - Variable de entorno GCP_TTS_API_KEY con tu API key de Google Cloud TTS
//     (habilita "Cloud Text-to-Speech API" en tu proyecto GCP y crea
//      una API key en Credentials)
//
// Uso:
//   GCP_TTS_API_KEY="AIza..." node generate-audio.js
//
// Voz por defecto: es-MX-Neural2-A (femenina, español de México).
// Cambia VOICE_NAME si querés otra (B, C, D, o Wavenet/Standard).
//
// Costos:
//   - Neural2: USD 16 por 1M caracteres
//   - Free tier: 1M caracteres/mes — los 8 textos consumen ~2k chars, gratis
// ============================================================

const fs = require("fs");
const path = require("path");

const TEXTS = require("./texts.js");

const API_KEY = process.env.GCP_TTS_API_KEY;
const VOICE_NAME = process.env.GCP_TTS_VOICE || "es-MX-Neural2-A";
const SPEAKING_RATE = parseFloat(process.env.GCP_TTS_RATE || "0.92");
const OUTPUT_DIR = path.join(__dirname, "assets", "audio");

if (!API_KEY) {
  console.error("\n❌ Falta GCP_TTS_API_KEY.");
  console.error("   Ejecutá: GCP_TTS_API_KEY=\"AIza...\" node generate-audio.js\n");
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function synthesize(text) {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
  const body = {
    input: { text },
    voice: { languageCode: "es-MX", name: VOICE_NAME },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: SPEAKING_RATE,
      pitch: 0,
      sampleRateHertz: 24000,
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await resp.json();

  if (!resp.ok || !json.audioContent) {
    const errMsg = json?.error?.message || `HTTP ${resp.status}`;
    throw new Error(errMsg);
  }

  return Buffer.from(json.audioContent, "base64");
}

(async () => {
  console.log(`\n🎙️  Generando ${TEXTS.length} audios con voz ${VOICE_NAME}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  let totalChars = 0;

  for (const t of TEXTS) {
    const filename = `${t.id}.mp3`;
    const outPath = path.join(OUTPUT_DIR, filename);

    try {
      process.stdout.write(`  ${filename}  «${t.title}»  ...`);
      const buffer = await synthesize(t.passage);
      fs.writeFileSync(outPath, buffer);
      totalChars += t.passage.length;
      console.log(` ✓ (${(buffer.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.log(` ✕`);
      console.error(`     error: ${err.message}`);
    }
  }

  console.log(`\n✅ Listo. Total: ${totalChars} caracteres.`);
  console.log(`   Costo estimado (Neural2): USD ${((totalChars * 16) / 1_000_000).toFixed(4)}\n`);
})();
