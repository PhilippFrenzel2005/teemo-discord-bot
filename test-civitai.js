// Diagnose-Skript: prüft, welche Civitai-Checkpoints für die Generierung
// freigeschaltet sind, und macht mit dem ersten funktionierenden einen Test.
//
//   node test-civitai.js
//
// Braucht CIVITAI_API_TOKEN in der .env.
import "dotenv/config";
import pkg from "civitai";
const { Civitai, Scheduler } = pkg;

const civitai = new Civitai({ auth: process.env.CIVITAI_API_TOKEN });

// Kandidaten-Checkpoints (URNs), die häufig für Generierung verfügbar sind.
const CANDIDATES = [
  "urn:air:sdxl:checkpoint:civitai:101055@128078",   // SD XL 1.0 VAE fix
  "urn:air:sdxl:checkpoint:civitai:133005@348913",   // Juggernaut XL
  "urn:air:sdxl:checkpoint:civitai:257749@290640",   // Pony Diffusion XL
  "urn:air:sd1:checkpoint:civitai:4384@128713",      // DreamShaper (SD 1.5)
  "urn:air:flux1:checkpoint:civitai:618692@691639",  // FLUX.1 dev (falls verfügbar)
];

if (!process.env.CIVITAI_API_TOKEN) {
  console.error("❌ CIVITAI_API_TOKEN fehlt in der .env");
  process.exit(1);
}

console.log("=== 1) Coverage-Check ===");
let covered = [];
for (const urn of CANDIDATES) {
  try {
    const cov = await civitai.models.get(urn);
    // cov enthält pro Model die verfügbaren Worker / Coverage-Infos
    const json = JSON.stringify(cov);
    const ok = json.includes('"available":true') || json.includes("scheduler");
    console.log(`${ok ? "✅" : "⚠️ "} ${urn}\n   → ${json.slice(0, 300)}`);
    if (ok) covered.push(urn);
  } catch (e) {
    console.log(`❌ ${urn}\n   → ${e.message}`);
  }
}

const target = covered[0] ?? CANDIDATES[0];
console.log(`\n=== 2) Test-Generierung mit: ${target} ===`);

try {
  const res = await civitai.image.fromText(
    {
      model: target,
      params: {
        prompt: "a cute teemo mushroom, league of legends, digital art",
        negativePrompt: "lowres, bad anatomy, watermark, blurry",
        scheduler: Scheduler.EULER_A,
        steps: 20,
        cfgScale: 7,
        width: 1024,
        height: 1024,
        clipSkip: 2,
        seed: -1,
      },
    },
    false
  );

  console.log("Token:", res.token);
  console.log("Initiale Antwort:", JSON.stringify(res, null, 2));

  // Selbst pollen und den vollen Status ausgeben (zeigt den Ablehnungsgrund)
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 4000));
    const status = await civitai.jobs.getByToken(res.token);
    const job = status?.jobs?.[0];
    const blobUrl = job?.result?.blobUrl;

    if (blobUrl) {
      console.log("\n✅ ERFOLG! Bild-URL:", blobUrl);
      console.log("👉 Setze diesen URN als DEFAULT_MODEL in commands/generate.js:");
      console.log("   " + target);
      process.exit(0);
    }
    if (job && job.scheduled === false) {
      console.log("\n❌ Job abgelehnt. Voller Status (enthält den Grund):");
      console.log(JSON.stringify(status, null, 2));
      process.exit(1);
    }
    console.log(`...läuft noch (${i + 1}) scheduled=${job?.scheduled}`);
  }
  console.log("\n⏱️  Timeout – Job lief, war aber nach 2 Min nicht fertig.");
} catch (e) {
  console.error("\n❌ Fehler bei der Generierung:", e.message);
  console.error(e);
}
