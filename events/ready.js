import { Events, ActivityType } from "discord.js";

export const name = Events.ClientReady;
export const once = true;

export async function execute(client) {
  console.log(`\n🤖 Bot online als: ${client.user.tag}`);
  console.log(`📡 Verbunden mit ${client.guilds.cache.size} Server(n)\n`);

  await client.application.edit({
    description: "Captain Teemo auf dem Posten. Experte für Geopolitik, internationale Konflikte und giftige Pilze. Scout-Ausbildung in Bandle City. Hehehe.",
  });

  // Status setzen
  client.user.setPresence({
    activities: [{ name: "/ping | discord.js v14", type: ActivityType.Watching }],
    status: "online",
  });
}
