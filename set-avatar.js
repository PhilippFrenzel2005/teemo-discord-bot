import { Client, GatewayIntentBits } from "discord.js";
import { readFileSync } from "fs";
import "dotenv/config";

const imagePath = process.argv[2];
if (!imagePath) {
  console.error("❌ Nutzung: node set-avatar.js <pfad-zum-bild>");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  try {
    const image = readFileSync(imagePath);
    const ext = imagePath.split(".").pop().toLowerCase();
    const mimeType = ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/webp";
    const base64 = `data:${mimeType};base64,${image.toString("base64")}`;

    await client.user.setAvatar(base64);
    console.log("✅ Avatar erfolgreich gesetzt!");
  } catch (err) {
    console.error("❌ Fehler:", err.message);
  } finally {
    client.destroy();
  }
});

client.login(process.env.DISCORD_TOKEN);
