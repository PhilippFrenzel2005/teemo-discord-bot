import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("info")
  .setDescription("Informationen über den Server oder einen User")
  .addSubcommand((sub) =>
    sub.setName("server").setDescription("Serverinfos anzeigen")
  )
  .addSubcommand((sub) =>
    sub
      .setName("user")
      .setDescription("Userinfos anzeigen")
      .addUserOption((opt) =>
        opt.setName("ziel").setDescription("Welcher User? (Standard: du selbst)")
      )
  );

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();

  if (sub === "server") {
    const guild = interaction.guild;
    const embed = new EmbedBuilder()
      .setTitle(`🏠 ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "👑 Besitzer", value: `<@${guild.ownerId}>`, inline: true },
        { name: "👥 Mitglieder", value: `${guild.memberCount}`, inline: true },
        { name: "📅 Erstellt am", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
      )
      .setColor(0x5865f2)
      .setFooter({ text: `ID: ${guild.id}` });

    await interaction.reply({ embeds: [embed] });

  } else if (sub === "user") {
    const target = interaction.options.getUser("ziel") ?? interaction.user;
    const member = interaction.guild.members.cache.get(target.id);

    const embed = new EmbedBuilder()
      .setTitle(`👤 ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "📅 Account erstellt", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true },
        { name: "📥 Server beigetreten", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : "Unbekannt", inline: true },
        { name: "🤖 Bot?", value: target.bot ? "Ja" : "Nein", inline: true }
      )
      .setColor(0x57f287)
      .setFooter({ text: `ID: ${target.id}` });

    await interaction.reply({ embeds: [embed] });
  }
}
