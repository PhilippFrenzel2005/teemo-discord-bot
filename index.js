import { Client, Collection, GatewayIntentBits, Events } from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Client erstellen ──────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ── Commands laden ────────────────────────────────────────────────────────────
client.commands = new Collection();

const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = pathToFileURL(join(commandsPath, file)).href;
  const command = await import(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Command geladen: /${command.data.name}`);
  } else {
    console.warn(`⚠️  ${file} fehlt 'data' oder 'execute'`);
  }
}

// ── Events laden ─────────────────────────────────────────────────────────────
const eventsPath = join(__dirname, "events");
const eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = pathToFileURL(join(eventsPath, file)).href;
  const event = await import(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`✅ Event geladen: ${event.name}`);
}

// ── Slash-Command Handler ─────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`❌ Kein Command gefunden für: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Fehler bei /${interaction.commandName}:`, error);
    try {
      const msg = { content: "❌ Beim Ausführen ist ein Fehler aufgetreten.", flags: 64 };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    } catch {
      // Interaction abgelaufen oder bereits beantwortet – ignorieren
    }
  }
});

// Verhindert Crash bei unbehandelten Discord-Fehlern
client.on("error", (err) => console.error("Discord Fehler:", err));

// ── Bot starten ───────────────────────────────────────────────────────────────
client.login(process.env.DISCORD_TOKEN);
