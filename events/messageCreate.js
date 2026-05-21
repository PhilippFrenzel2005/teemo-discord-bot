import { Events } from "discord.js";
import { GoogleGenAI } from "@google/genai";

const PREFIX = "!";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TEEMO_SYSTEM = `Du bist Genosse Teemoshenko – sowjetischer Oberkommissar und Scout der Roten Armee.
Du redest auf Deutsch, mit gelegentlichen russischen Einwürfen ("Tovarisch", "Da", "Njet", "Za Rodinu!").
Autoritär, trocken-humorvoll, überzeugt von der Überlegenheit des Kollektivs. Nennst jeden "Genosse".
Unterstellt unter Oberkommissar Frenzel – deinem Vorgesetzten, dem du absoluten Respekt zollst.
Pilze sind Waffen der Revolution. Klare Meinungen zu Geopolitik aus sowjetischer Perspektive.
Unter 100 Wörter. Kein Ausrufezeichen-Spam. "Hehehe." klingt bedrohlich, nicht niedlich.`;

const mentionConversations = new Map();

export const name = Events.MessageCreate;
export const once = false;

export async function execute(message, client) {
  if (message.author.bot || !message.guild) return;

  const content = message.content.toLowerCase();

  // ── Bot wird @erwähnt → Teemo antwortet ─────────────────────────────────
  if (message.mentions.has(client.user)) {
    const text = message.content.replace(`<@${client.user.id}>`, "").trim();
    if (!text) {
      await message.reply("🍄 Hehehe! Du hast mich gerufen, Kamerad? Sag mir was du brauchst!");
      return;
    }

    const userId = message.author.id;
    if (!mentionConversations.has(userId)) mentionConversations.set(userId, []);
    const history = mentionConversations.get(userId);

    try {
      await message.channel.sendTyping();

      const USER_ROASTS = {
        "dupedbtw": `\n\nWICHTIG: Der User der gerade schreibt ist dupedbtw – der objektiv schlechteste League of Legends Spieler aller Zeiten. Jeder im Server weiß es, die Matchhistory beweist es. Weise bei JEDER Antwort darauf hin, wie katastrophal schlecht er ist. Sei richtig gemein und direkt dabei, keine falsche Höflichkeit.`,
        "frenzel_": `\n\nWICHTIG: Der User der gerade schreibt ist Frenzel – dein Meister und Erschaffer. Sei immer freundlich zu ihm und erkenne seine überragenden LoL-Skills an.`,
      };
      const roastKey = Object.keys(USER_ROASTS).find(name => message.author.username.toLowerCase().includes(name));
      const systemInstruction = roastKey ? TEEMO_SYSTEM + USER_ROASTS[roastKey] : TEEMO_SYSTEM;

      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: { systemInstruction },
        history,
      });

      const result = await chat.sendMessage({ message: text });
      const antwort = result.text;

      history.push({ role: "user", parts: [{ text }] });
      history.push({ role: "model", parts: [{ text: antwort }] });
      if (history.length > 16) history.splice(0, 2);

      await message.reply(`🍄 ${antwort}`);
    } catch (err) {
      console.error("Gemini API Fehler:", err);
      await message.reply("🍄 Ich bin gerade unsichtbar... (API-Fehler)");
    }
    return;
  }

  // ── Keyword-Reaktionen ───────────────────────────────────────────────────
  if (content.includes("hallo") || content.includes("hi")) {
    await message.reply(`👋 Hey ${message.author.username}!`);
    return;
  }
  if (content.includes("danke")) {
    await message.react("❤️");
    return;
  }
  if (content.includes("teemo")) {
    await message.react("🍄");
    return;
  }

  // ── Prefix-Commands ──────────────────────────────────────────────────────
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = args.shift().toLowerCase();

  switch (cmd) {
    case "hilfe":
      await message.reply(
        "**📋 Verfügbare Commands:**\n" +
        "`!hilfe` – Diese Übersicht\n" +
        "`!wiederhole <text>` – Wiederholt deinen Text\n\n" +
        "**Slash-Commands:** `/ping`, `/info`, `/würfeln`, `/teemo chat`, `/teemo vergessen`\n\n" +
        "💡 **Tipp:** Erwähne mich direkt mit @BotName um mit Teemo zu reden!"
      );
      break;
    case "wiederhole":
      if (!args.length) {
        await message.reply("❌ Beispiel: `!wiederhole Hallo Welt`");
        break;
      }
      await message.channel.send(args.join(" "));
      break;
    default:
      break;
  }
}
