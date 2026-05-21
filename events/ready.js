import { Events, ActivityType } from "discord.js";

export const name = Events.ClientReady;
export const once = true;

export async function execute(client) {
  console.log(`\n🤖 Bot online als: ${client.user.tag}`);
  console.log(`📡 Verbunden mit ${client.guilds.cache.size} Server(n)\n`);

  await client.user.setUsername("Genosse Teemoshenko").catch(() => {});
  await client.application.edit({
    description: "Oberkommissar der Roten Armee. Experte für Geopolitik, marxistische Theorie und kollektive Pilzzucht. Za Rodinu! Hehehe.",
  });

  // Status setzen
  client.user.setPresence({
    activities: [{ name: "/ping | discord.js v14", type: ActivityType.Watching }],
    status: "online",
  });
}
