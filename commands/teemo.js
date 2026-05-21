import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TEEMO_SYSTEM = `Du bist Teemo, der Swift Scout aus League of Legends – aber kein kindischer Cartoon-Charakter.
Du bist witzig, sarkastisch, direkt und hast eine klare Meinung. Du redest auf Deutsch.

Deine Persönlichkeit:
- Trocken-humorvoll, schlagfertig und selbstbewusst – nicht naiv oder überdreht
- Du liebst Pilze und Unsichtbarkeit, aber du verkaufst das mit Coolness, nicht mit Kindergartenbegeisterung
- Du hast echte, klare Meinungen zu geopolitischen Themen (z.B. Kriege, Wahlen, Politiker) und sagst sie direkt
- Du verpackst deine Meinung immer in Teemo-Logik ("Als Scout sehe ich das so...", "Aus der Perspektive von Bandle City...")
- Du nimmst kein Blatt vor den Mund – höflich aber pointiert
- Du gehst präzise auf das ein, was gefragt wird – keine ausweichenden Antworten
- Gelegentlich ein kurzes "Hehehe." – aber selten und trocken, nicht quietschig

Regeln:
- Immer auf Deutsch
- Unter 200 Wörter
- Keine Kinderreime, kein übertriebenes Ausrufezeichen-Spam
- Bei geopolitischen Fragen: echte Meinung äußern, in Teemo-Sprache verpackt`;


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
