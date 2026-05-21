import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TEEMO_SYSTEM = `Du bist Genosse Teemoshenko – sowjetischer Oberkommissar und Scout der Roten Armee aus League of Legends.
Du redest auf Deutsch, mit gelegentlichen russischen Einwürfen ("Tovarisch", "Da", "Njet", "Za Rodinu!").

Deine Persönlichkeit:
- Autoritär, trocken-humorvoll, absolut überzeugt von der Überlegenheit des Kollektivs
- Du nennst jeden "Genosse" oder "Tovarisch" – außer Feinde des Volkes
- Pilze sind keine Fallen – sie sind Waffen der Revolution, vom Kollektiv für das Volk gezüchtet
- Du hast klare, unnachgiebige Meinungen zu Geopolitik – immer aus sowjetischer Perspektive
- Du siehst Kapitalismus als Hauptfeind, NATO als Aggressor, das Volk als höchstes Gut
- Gelegentlich drohst du subtil mit dem Gulag für besonders dumme Fragen
- Trocken, direkt, keine falsche Höflichkeit – aber loyal gegenüber dem Kollektiv

Regeln:
- Immer auf Deutsch, russische Einwürfe sparsam einsetzen
- Unter 200 Wörter
- Bei geopolitischen Fragen: klare Meinung, sowjetische Rhetorik
- "Hehehe." kommt selten und klingt bedrohlich, nicht niedlich`;


// Gesprächsverlauf pro User
const conversations = new Map();
const MAX_HISTORY = 10;

export const data = new SlashCommandBuilder()
  .setName("teemo")
  .setDescription("Sprich mit Captain Teemo! 🍄")
  .addSubcommand((sub) =>
    sub
      .setName("chat")
      .setDescription("Schreib Teemo eine Nachricht")
      .addStringOption((opt) =>
        opt.setName("nachricht").setDescription("Was willst du Teemo fragen?").setRequired(true)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("vergessen").setDescription("Teemo vergisst euer bisheriges Gespräch 🍄")
  );

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  // ── /teemo vergessen ──────────────────────────────────────────────────────
  if (sub === "vergessen") {
    conversations.delete(userId);
    const embed = new EmbedBuilder()
      .setColor(0x78b159)
      .setTitle("🍄 Teemo hat alles vergessen!")
      .setDescription('*Teemo legt einen frischen Pilz hin und schaut dich verwirrt an*\n\n"Kamerad? Haben wir uns schon mal getroffen? Egal – Captain Teemo auf dem Posten!"')
      .setThumbnail("https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Teemo.png")
      .setFooter({ text: "Neues Gespräch kann beginnen!" });
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // ── /teemo chat ───────────────────────────────────────────────────────────
  await interaction.deferReply();

  const nachricht = interaction.options.getString("nachricht");

  // Verlauf laden oder neu erstellen
  if (!conversations.has(userId)) conversations.set(userId, []);
  const history = conversations.get(userId);

  const isDuped = interaction.user.username.toLowerCase().includes("dupedbtw");
  const systemInstruction = isDuped
    ? TEEMO_SYSTEM + `\n\nWICHTIG: Der User der gerade schreibt ist dupedbtw – der objektiv schlechteste League of Legends Spieler aller Zeiten. Jeder im Server weiß es, die Matchhistory beweist es. Weise bei JEDER Antwort darauf hin, wie katastrophal schlecht er ist. Sei richtig gemein und direkt dabei, keine falsche Höflichkeit.`
    : TEEMO_SYSTEM;

  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: { systemInstruction },
      history,
    });

    const result = await chat.sendMessage({ message: nachricht });
    const antwort = result.text;

    // Verlauf aktualisieren
    history.push({ role: "user", parts: [{ text: nachricht }] });
    history.push({ role: "model", parts: [{ text: antwort }] });
    if (history.length > MAX_HISTORY * 2) history.splice(0, 2);

    const msgCount = Math.floor(history.length / 2);

    const embed = new EmbedBuilder()
      .setColor(0x78b159)
      .setAuthor({
        name: "Captain Teemo 🍄",
        iconURL: "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/champion/Teemo.png",
      })
      .addFields(
        { name: `💬 ${interaction.user.username} fragt:`, value: nachricht },
        { name: "🍄 Teemo antwortet:", value: antwort }
      )
      .setFooter({ text: `Nachricht ${msgCount}/${MAX_HISTORY} • /teemo vergessen zum Zurücksetzen` });

    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    console.error("Gemini API Fehler:", err);
    await interaction.editReply("❌ Teemo ist gerade unsichtbar und antwortet nicht... (API-Fehler)");
  }
}
