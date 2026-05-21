import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("würfeln")
  .setDescription("Wirft einen Würfel 🎲")
  .addIntegerOption((opt) =>
    opt
      .setName("seiten")
      .setDescription("Wie viele Seiten? (Standard: 6)")
      .setMinValue(2)
      .setMaxValue(1000)
  );

export async function execute(interaction) {
  const sides = interaction.options.getInteger("seiten") ?? 6;
  const result = Math.floor(Math.random() * sides) + 1;

  await interaction.reply(
    `🎲 Du hast einen **W${sides}** geworfen und eine **${result}** bekommen!`
  );
}
