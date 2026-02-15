import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("todo")
    .setDescription("Cria um item de tarefa (não funcional)")
    .addStringOption((option) =>
      option.setName("nome").setDescription("Nome da tarefa").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("descricao")
        .setDescription("Descrição da tarefa")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const username = interaction.user.id;
    const name = interaction.options.getString("nome", true);
    const description = interaction.options.getString("descricao", true);

    await interaction.reply(
      `[NÃO FUNCIONAL] 📝 Todo criado por <@${username}>: **${name}** - ${description}`,
    );
  },
};
