import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from "discord.js";

// Qwen-Image läuft NICHT über die civitai-SDK (textToImage), sondern über den
// v2-Workflows-Endpoint der Orchestration-API (imageGen recipe).
const ORCHESTRATION = "https://orchestration.civitai.com";

// Qwen-freundliche Auflösungen pro Seitenverhältnis (teilbar durch 8).
const FORMATS = {
  quadrat: { width: 1024, height: 1024 },
  hoch: { width: 832, height: 1216 },
  quer: { width: 1216, height: 832 },
};

const DEFAULT_NEGATIVE =
  "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, " +
  "fewer digits, cropped, worst quality, low quality, jpeg artifacts, watermark, blurry";

// Extrahiert die Bild-URL aus einer Workflow-Antwort.
function extractImageUrl(data) {
  const step = data?.steps?.find((s) => s?.output?.images?.length);
  return step?.output?.images?.[0]?.url;
}

export const data = new SlashCommandBuilder()
  .setName("generate")
  .setDescription("Generiert ein Bild via Qwen-Image (Civitai) 🍄")
  .addStringOption((opt) =>
    opt
      .setName("prompt")
      .setDescription("Was soll Teemo malen? (Qwen versteht auch Text im Bild gut)")
      .setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("format")
      .setDescription("Bildformat (Standard: quadrat)")
      .addChoices(
        { name: "Quadrat (1024×1024)", value: "quadrat" },
        { name: "Hochformat (832×1216)", value: "hoch" },
        { name: "Querformat (1216×832)", value: "quer" }
      )
  )
  .addStringOption((opt) =>
    opt
      .setName("negativ")
      .setDescription("Was soll NICHT im Bild sein? (optional)")
  );

export async function execute(interaction) {
  const token = process.env.CIVITAI_API_TOKEN;
  if (!token) {
    await interaction.reply({
      content:
        "❌ Genosse, der Civitai-Schlüssel fehlt im Kollektiv. Setze `CIVITAI_API_TOKEN` in der `.env`.",
      flags: 64,
    });
    return;
  }

  await interaction.deferReply();

  const prompt = interaction.options.getString("prompt");
  const negativePrompt = interaction.options.getString("negativ") ?? DEFAULT_NEGATIVE;
  const formatKey = interaction.options.getString("format") ?? "quadrat";
  const { width, height } = FORMATS[formatKey] ?? FORMATS.quadrat;

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
          prompt,
          negativePrompt,
          width,
          height,
          cfgScale: 2.5, // Qwen will ~2.5, nicht 7 wie SDXL
          steps: 20,
        },
      },
    ],
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    // Job einreichen, bis zu 60s direkt warten.
    const res = await fetch(
      `${ORCHESTRATION}/v2/consumer/workflows?wait=60`,
      { method: "POST", headers, body: JSON.stringify(body) }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Qwen Submit-Fehler:", res.status, text);
      const hint =
        res.status === 401 || res.status === 403
          ? " (Token ungültig oder ohne Generierungs-Rechte)"
          : res.status === 402
          ? " (nicht genug Buzz)"
          : "";
      await interaction.editReply(
        `❌ Civitai hat den Auftrag abgelehnt, Genosse. HTTP ${res.status}${hint}`
      );
      return;
    }

    let data = await res.json();
    let imageUrl = extractImageUrl(data);

    // Falls nach wait=60 noch nicht fertig: per Workflow-ID nachpollen.
    const workflowId = data?.id ?? data?.workflowId;
    if (!imageUrl && workflowId) {
      for (let i = 0; i < 30 && !imageUrl; i++) {
        await new Promise((r) => setTimeout(r, 4000));
        const poll = await fetch(
          `${ORCHESTRATION}/v2/consumer/workflows/${workflowId}`,
          { headers }
        );
        if (!poll.ok) continue;
        data = await poll.json();
        imageUrl = extractImageUrl(data);
        if (data?.status === "failed") {
          console.error("Qwen Workflow failed:", JSON.stringify(data));
          await interaction.editReply(
            "❌ Der Qwen-Job ist fehlgeschlagen, Genosse. Versuch es erneut."
          );
          return;
        }
      }
    }

    if (!imageUrl) {
      await interaction.editReply(
        "🍄 Das Bild ist noch in den Pilzwäldern verschollen, Genosse... (Zeitüberschreitung). Versuch es erneut."
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x78b159)
      .setAuthor({
        name: "Genosse Teemoshenko – Atelier der Revolution 🍄",
        iconURL: "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Teemo.png",
      })
      .setDescription(`**Auftrag von ${interaction.user.username}:**\n> ${prompt}`)
      .setFooter({ text: `${width}×${height} • Qwen-Image • Hehehe.` })
      .setTimestamp();

    // Bild selbst herunterladen und als Datei anhängen – zuverlässiger als
    // Discord die (signierte, evtl. ablaufende) URL proxen zu lassen.
    try {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const file = new AttachmentBuilder(buffer, { name: "teemo.jpeg" });
      embed.setImage("attachment://teemo.jpeg");
      await interaction.editReply({ embeds: [embed], files: [file] });
    } catch (dlErr) {
      // Fallback: doch die URL direkt setzen
      console.error("Bild-Download fehlgeschlagen, nutze URL:", dlErr);
      embed.setImage(imageUrl);
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (err) {
    console.error("Qwen Fehler:", err);
    await interaction.editReply(
      `❌ Das Bild konnte nicht erzeugt werden, Genosse.\n\`${err.message ?? err}\``
    );
  }
}
