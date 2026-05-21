import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Zeigt die Bot-Latenz an 🏓");

export async function execute(interaction) {
  const sent = await interaction.reply({ content: "Messe…", fetchReply: true });
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  const apiLatency = Math.round(interaction.client.ws.ping);

  await interaction.editReply(
    `🏓 **Pong!**\n` +
    `> Bot-Latenz: **${latency}ms**\n` +
    `> API-Latenz: **${apiLatency}ms**`
  );
}
