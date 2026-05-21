import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const commands = [];

const commandFiles = readdirSync(join(__dirname, "commands")).filter((f) =>
  f.endsWith(".js")
);

for (const file of commandFiles) {
  const filePath = pathToFileURL(join(__dirname, "commands", file)).href;
  const cmd = await import(filePath);
  commands.push(cmd.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  console.log(`🔄 Registriere ${commands.length} Slash-Command(s)...`);
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log("✅ Slash-Commands erfolgreich registriert!");
} catch (error) {
  console.error("❌ Fehler beim Registrieren:", error);
}
