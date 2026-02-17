import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import usersRepository from "../../repositories/users.repository.js";
import levelsRepository from "../../repositories/levels.repository.js";
import { getRankTitle } from "./shared/rank-title-by-level.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nivel")
    .setDescription("Mostra seu nivel, XP e titulo atual no servidor."),

  async execute(interaction: ChatInputCommandInteraction) {
    const userDiscordId = interaction.user.id;
    const username = interaction.user.tag;
    const guildId = interaction.guildId;

    if (!interaction.inGuild() || !guildId) {
      await interaction.reply("Este comando so funciona em servidores.");
      return;
    }

    const user = await usersRepository.findUserByDiscordId(
      userDiscordId,
      guildId,
    );

    if (!user) {
      await interaction.reply(
        "Voce ainda nao esta registrado. Use /register para criar seu perfil.",
      );
      return;
    }

    const currentLevel = await levelsRepository.getByUserId(user.id);

    const userLevel = currentLevel?.level ?? 0;
    const title = getRankTitle(userLevel);

    const createdAt = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("pt-BR")
      : "N/A";

    const embed = new EmbedBuilder()
      .setAuthor({
        name: username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle("Perfil do usuario")
      .setColor(0x2b83f6)
      .addFields(
        {
          name: "Nivel",
          value: currentLevel ? String(currentLevel.level) : "N/A",
          inline: true,
        },
        {
          name: "XP",
          value: currentLevel ? String(currentLevel.xp) : "N/A",
          inline: true,
        },
        {
          name: "Titulo",
          value: title,
          inline: true,
        },
        {
          name: "Registrado em",
          value: createdAt,
          inline: true,
        },
      )
      .setFooter({ text: `ID: ${user.discordId}` })
      .setTimestamp(new Date());

    await interaction.reply({ embeds: [embed] });
  },
};
