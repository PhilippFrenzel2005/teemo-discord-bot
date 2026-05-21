import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DDragon = "https://ddragon.leagueoflegends.com";

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getVersion() {
  const versions = await fetchJson(`${DDragon}/api/versions.json`);
  return versions[0];
}

async function findChampion(input, version) {
  const data = await fetchJson(`${DDragon}/cdn/${version}/data/en_US/champion.json`);
  const query = input.toLowerCase().replace(/[\s']/g, "");
  return Object.values(data.data).find(
    (c) =>
      c.name.toLowerCase().replace(/[\s']/g, "") === query ||
      c.id.toLowerCase() === query
  );
}

const BUILD_PROMPT = `Du bist ein League of Legends Meta-Experte. Gib einen aktuellen Meta-Build für den genannten Champion zurück.

Antworte NUR mit einem JSON-Objekt in diesem Format, keine Erklärungen davor oder danach:
{
  "role": "Top / Mid / Jungle / Bot / Support",
  "summoner_spells": ["Flash", "Ignite"],
  "keystone": "Electrocute",
  "secondary_path": "Sorcery",
  "rune_secondaries": ["Manaflow Band", "Gathering Storm"],
  "starter": "Long Sword + 3x Health Potion",
  "boots": "Sorcerer's Shoes",
  "core": ["Luden's Tempest", "Shadowflame", "Rabadon's Deathcap"],
  "skill_order": "Max Q > E > W",
  "first_skill": "Q",
  "tip": "Kurzer Teemo-Tipp zum Spielen (1 Satz, auf Deutsch, in Teemo-Sprache)"
}`;

export const data = new SlashCommandBuilder()
  .setName("build")
  .setDescription("🍄 Meta-Build für jeden Champion – von Teemo persönlich erklärt")
  .addStringOption((opt) =>
    opt.setName("champion").setDescription("Champion-Name (Englisch)").setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("lane")
      .setDescription("Lane (optional, sonst beste Lane)")
      .addChoices(
        { name: "Top", value: "Top" },
        { name: "Jungle", value: "Jungle" },
        { name: "Mid", value: "Mid" },
        { name: "Bot (ADC)", value: "Bot" },
        { name: "Support", value: "Support" }
      )
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const championInput = interaction.options.getString("champion");
  const lane = interaction.options.getString("lane");

  try {
    const version = await getVersion();
    const champion = await findChampion(championInput, version);

    if (!champion) {
      await interaction.editReply(
        `❌ **${championInput}** nicht gefunden. Nutze den englischen Namen (z.B. \`Jinx\`, \`Lee Sin\`, \`Twisted Fate\`).`
      );
      return;
    }

    const prompt = lane
      ? `Champion: ${champion.name}, Lane: ${lane}`
      : `Champion: ${champion.name} (beste Meta-Lane)`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { systemInstruction: BUILD_PROMPT },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let build;
    try {
      const raw = result.text.replace(/```json|```/g, "").trim();
      build = JSON.parse(raw);
    } catch {
      throw new Error("Gemini hat kein gültiges JSON zurückgegeben");
    }

    const iconUrl = `${DDragon}/cdn/${version}/img/champion/${champion.id}.png`;
    const coreText = build.core?.join(" → ") ?? "–";
    const runeText = `**${build.keystone}** + ${build.secondary_path}\n${build.rune_secondaries?.join(", ") ?? ""}`;

    const embed = new EmbedBuilder()
      .setColor(0x78b159)
      .setTitle(`🍄 ${champion.name} – ${build.role} Meta Build`)
      .setThumbnail(iconUrl)
      .addFields(
        { name: "⚡ Summoner Spells", value: build.summoner_spells?.join(" + ") ?? "–", inline: true },
        { name: "📖 Skill Order", value: `${build.skill_order}\nFirst: ${build.first_skill}`, inline: true },
        { name: "​", value: "​", inline: true },
        { name: "💎 Runen", value: runeText, inline: false },
        { name: "🏁 Starter", value: build.starter ?? "–", inline: true },
        { name: "👟 Boots", value: build.boots ?? "–", inline: true },
        { name: "​", value: "​", inline: true },
        { name: "⚔️ Core Build", value: coreText, inline: false },
        { name: "🍄 Teemos Tipp", value: build.tip ?? "Hehehe.", inline: false }
      )
      .setFooter({ text: `Patch ${version} • KI-generiert von Teemo • Hehehe.` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("Build-Fehler:", err);
    await interaction.editReply(`❌ Build konnte nicht geladen werden.\n\`${err.message}\``);
  }
}
