// Diagnose: testet die Qwen-Image-Generierung über den v2-Workflows-Endpoint.
//   node test-qwen.js
// Braucht CIVITAI_API_TOKEN in der .env.
import "dotenv/config";

const ORCHESTRATION = "https://orchestration.civitai.com";
const token = process.env.CIVITAI_API_TOKEN;

if (!token) {
  console.error("❌ CIVITAI_API_TOKEN fehlt in der .env");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const body = {
  steps: [
    {
      $type: "imageGen",
      input: {
        engine: "sdcpp",
        ecosystem: "qwen",
        model: "20b",
        operation: "createImage",
        version: "latest",
        prompt: "a cute teemo mushroom, league of legends, digital art",
        negativePrompt: "lowres, bad anatomy, watermark, blurry",
        width: 1024,
        height: 1024,
        cfgScale: 2.5,
        steps: 20,
      },
    },
  ],
};

function extractImageUrl(data) {
  const step = data?.steps?.find((s) => s?.output?.images?.length);
  return step?.output?.images?.[0]?.url;
}

console.log("=== POST /v2/consumer/workflows?wait=60 ===");
const res = await fetch(`${ORCHESTRATION}/v2/consumer/workflows?wait=60`, {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});

console.log("HTTP", res.status, res.statusText);
const text = await res.text();
if (!res.ok) {
  console.error("Antwort:", text);
  process.exit(1);
}

let data = JSON.parse(text);
console.log("Antwort (gekürzt):", JSON.stringify(data, null, 2).slice(0, 1500));

let imageUrl = extractImageUrl(data);
const workflowId = data?.id ?? data?.workflowId;
console.log("\nworkflowId:", workflowId, "| status:", data?.status);

for (let i = 0; i < 30 && !imageUrl; i++) {
  await new Promise((r) => setTimeout(r, 4000));
  const poll = await fetch(`${ORCHESTRATION}/v2/consumer/workflows/${workflowId}`, {
    headers,
  });
  if (!poll.ok) {
    console.log(`...poll HTTP ${poll.status}`);
    continue;
  }
  data = await poll.json();
  imageUrl = extractImageUrl(data);
  console.log(`...läuft (${i + 1}) status=${data?.status}`);
  if (data?.status === "failed") {
    console.error("❌ failed:", JSON.stringify(data, null, 2));
    process.exit(1);
  }
}

if (imageUrl) {
  console.log("\n✅ ERFOLG! Bild-URL:", imageUrl);
} else {
  console.log("\n⏱️  Timeout – kein Bild erhalten.");
  console.log("Letzte Antwort:", JSON.stringify(data, null, 2).slice(0, 2000));
}
