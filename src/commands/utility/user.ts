import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("user")
    .setDescription("Provides information about the user."),

  async execute(interaction: ChatInputCommandInteraction) {
    const username = interaction.user.username;

    await interaction.reply(`This command was run by ${username}.`);
  },
};
