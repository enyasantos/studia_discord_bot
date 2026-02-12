import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("configurar")
    .setDescription("Exibe o card de gerenciamento de canais"),

  rows: [
    new ButtonBuilder()
      .setCustomId("configure_dynamic_voices")
      .setLabel("🎙️ Configurar Dynamic Voices")
      .setStyle(ButtonStyle.Primary),
  ],

  async execute(interaction: ChatInputCommandInteraction) {
    // if (!interaction.isButton()) return;

    const embed = new EmbedBuilder()
      .setTitle("🎛️ Gerenciamento de canais de estudo")
      .setDescription(
        `Ao ativar esta opção, será criada uma **nova categoria** com um **canal de voz** e um **canal de texto** dedicados ao estudo.\n\n` +
          `🕒 **Importante:** O tempo que você passar no canal de voz será **registrado automaticamente** para contabilizar seu progresso e XP.\n\n` +
          `✏️ Você pode **alterar os nomes** dos canais se quiser, para personalizar sua experiência.\n\n` +
          `🌱 **Observação:** Apenas o proprietário do canal e admins podem gerenciar os canais e usar os botões abaixo.\n\n`,
      )
      .setColor("Green");

    await interaction.reply({
      embeds: [embed],
      components: [{ type: 1, components: this.rows }],
    });
  },
};
