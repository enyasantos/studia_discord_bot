import { SlashCommandBuilder } from "discord.js";
import usersService from "../../services/users.service.js";
import levelsService from "../../services/levels.service.js";

export default {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Registra você no sistema de XP/Level do bot"),
  async execute(interaction: any) {
    const discordId = interaction.user.id;
    const guildId = interaction.guildId;
    const username = interaction.user.tag;

    try {
      const existingUser = await usersService.findUserByDiscordId(
        discordId,
        guildId,
      );
      if (existingUser) {
        await interaction.reply(
          `<@${interaction.user.id}> já está registrado!`,
        );
        return;
      }

      const user = await usersService.upsertUser(discordId, username, guildId);
      await levelsService.create(user.id);

      await interaction.reply(
        `<@${interaction.user.id}> foi registrado com sucesso!`,
      );
    } catch (error) {
      console.error("Error registering user:", error);
      await interaction.reply(
        `Ocorreu um erro ao registrar você. Tente novamente mais tarde.`,
      );
    }
  },
};
