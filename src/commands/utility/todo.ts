import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("todo")
    .setDescription("Create a todo item")
    .addStringOption((option) =>
      option.setName("text").setDescription("Todo content").setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const username = interaction.user.id;
    const text = interaction.options.getString("text", true);

    await interaction.reply(`📝 Todo criado por <@${username}>: **${text}**`);
  },
};
