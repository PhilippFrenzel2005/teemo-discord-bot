import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import pkg from "civitai";
const { Civitai, Scheduler } = pkg;

const civitai = new Civitai({ auth: process.env.CIVITAI_API_TOKEN });

// Standard-Checkpoint (SDXL). Über die /generate-Option "modell" überschreibbar.
const DEFAULT_MODEL = "urn:air:sdxl:checkpoint:civitai:101055@128078"; // SD XL 1.0 (96 Worker, verfügbar)

// SDXL-freundliche Auflösungen pro Seitenverhältnis
const FORMATS = {
  quadrat: { width: 1024, height: 1024 },
  hoch: { width: 832, height: 1216 },
  quer: { width: 1216, height: 832 },
};

const DEFAULT_NEGATIVE =
  "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, " +
  "fewer digits, cropped, worst quality, low quality, jpeg artifacts, watermark, blurry";

export const data = new SlashCommandBuilder()
  .setName("generate")
  .setDescription("Generiert ein Bild via Civitai AI 🍄")
  .addStringOption((opt) =>
    opt
      .setName("prompt")
      .setDescription("Was soll Teemo malen? (Englisch funktioniert am besten)")
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
  )
  .addStringOption((opt) =>
    opt
      .setName("modell")
      .setDescription("Civitai Model-URN (optional, für Profis)")
  );

export async function execute(interaction) {
  if (!process.env.CIVITAI_API_TOKEN) {
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
  const model = interaction.options.getString("modell") ?? DEFAULT_MODEL;
  const { width, height } = FORMATS[formatKey] ?? FORMATS.quadrat;

  const input = {
    model,
    params: {
      prompt,
      negativePrompt,
      scheduler: Scheduler.EULER_A,
      steps: 25,
      cfgScale: 7,
      width,
      height,
      clipSkip: 2,
      seed: -1,
    },
  };

  try {
    // Job einreichen OHNE auf das SDK-interne Polling zu warten (das pollt nur
    // alle 30s / 10min und verschluckt Fehler). Wir pollen selbst – schneller
    // und mit klaren Fehlermeldungen.
    const response = await civitai.image.fromText(input, false);
    const token = response?.token;

    if (!token) {
      await interaction.editReply(
        "❌ Civitai hat keinen Job angenommen, Genosse. (kein Token) – Token/Buzz prüfen."
      );
      return;
    }

    // Selbst pollen: alle 4s, bis zu ~3 Minuten.
    // Achtung: result ist ein ARRAY ([{ blobKey, available, blobUrl, seed }]).
    // blobUrl erscheint erst, wenn available === true.
    let blobUrl;
    const maxTries = 45;
    for (let i = 0; i < maxTries; i++) {
      await new Promise((r) => setTimeout(r, 4000));

      const status = await civitai.jobs.getByToken(token);
      const job = status?.jobs?.[0];
      const item = Array.isArray(job?.result) ? job.result[0] : job?.result;
      blobUrl = item?.blobUrl;

      if (blobUrl) break;

      // Job fehlgeschlagen: nicht mehr eingeplant, kein Ergebnis verfügbar
      if (job && job.scheduled === false && item?.available !== true) {
        console.error("Civitai Job nicht eingeplant:", JSON.stringify(status));
        await interaction.editReply(
          "❌ Der Job wurde abgelehnt, Genosse. Meist liegt das am Model (nicht für Generierung verfügbar) oder an fehlendem Buzz. Probier ein anderes `modell` oder lade Buzz auf."
        );
        return;
      }
    }

    if (!blobUrl) {
      await interaction.editReply(
        "🍄 Das Bild ist noch in den Pilzwäldern verschollen, Genosse... (Zeitüberschreitung nach 3 Minuten). Versuch es erneut."
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
      .setImage(blobUrl)
      .setFooter({ text: `${width}×${height} • Civitai • Hehehe.` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("Civitai Fehler:", err);
    await interaction.editReply(
      `❌ Das Bild konnte nicht erzeugt werden, Genosse.\n\`${err.message ?? err}\``
    );
  }
}
