import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import sessionService from "../../services/session.service.js";
import logger from "../../config/logger.js";

export default {
  data: new SlashCommandBuilder()
    .setName("tempo")
    .setDescription(
      "Mostra o tempo total que você passou estudando no canal de voz.",
    )
    .addStringOption((option) =>
      option
        .setName("tipo")
        .setDescription("Selecione qual período deseja visualizar.")
        .setRequired(true)
        .addChoices(
          {
            name: "🟢 Sessão Atual",
            value: "atual",
          },
          {
            name: "🕒 Última Sessão",
            value: "ultima",
          },
          {
            name: "📊 Tempo Total",
            value: "total",
          },
        ),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const type = interaction.options.getString("tipo", true);
    if (type === "atual") {
      const { embed, row } = await this.build(
        interaction.user.id,
        interaction.guild?.id || "",
      );
      await interaction.reply({ embeds: [embed], components: [row] });
    } else if (type === "ultima") {
      const embed = new EmbedBuilder()
        .setTitle("⏳ Última Sessão")
        .setColor("Green")
        .setDescription("Em breve, esta funcionalidade estará disponível.");
      await interaction.reply({ embeds: [embed] });
    } else if (type === "total") {
      const embed = new EmbedBuilder()
        .setTitle("📈 Tempo Total Estudado")
        .setColor("Purple")
        .setDescription("Em breve, esta funcionalidade estará disponível.");
      await interaction.reply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setTitle("❌ Opção Inválida")
        .setColor("Red")
        .setDescription("Por favor, selecione uma opção válida.");
      await interaction.reply({ embeds: [embed] });
    }
  },

  async build(userId: string, guildId: string) {
    const { now, startTime } = await this.getStudyTime(userId, guildId);

    let embed: EmbedBuilder;
    let row: ActionRowBuilder<ButtonBuilder> | undefined;

    if (now && startTime) {
      const minutesStudied = Math.floor(
        (now.getTime() - startTime.getTime()) / 60000,
      );
      const multiplier = 1;

      embed = new EmbedBuilder()
        .setTitle("📊 SESSÃO ATUAL")
        .setColor("Blue")
        .addFields({
          name: "⏱️ Tempo Decorrido",
          value: `${this.formatTime(now, startTime)} (${minutesStudied} minutos)`,
          inline: false,
        })
        .addFields({
          name: "🎁 • MULTIPLICADORES ATIVOS",
          value: `Multiplicador Total: ${multiplier}\nBase (1.0x)\n\nToque em **Atualizar** para recarregar os dados sem reexecutar o comando.`,
        });

      row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("refresh_session")
          .setLabel("🔄 Atualizar")
          .setStyle(ButtonStyle.Primary),
      );
    } else {
      embed = new EmbedBuilder()
        .setTitle("⚠️ Sessão Inativa")
        .setColor("Yellow")
        .setDescription("No momento, você não possui uma sessão ativa.");

      row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("refresh_session")
          .setLabel("🔄 Atualizar")
          .setStyle(ButtonStyle.Primary),
      );
    }

    return { embed, row };
  },

  async getStudyTime(
    discordId: string,
    guildId: string,
  ): Promise<{ now: Date | null; startTime: Date | null }> {
    const session = await sessionService.getCurrentSession(discordId, guildId);
    if (!session) {
      logger.info(`[Time] No active session found for user ${discordId}`);
      return { now: null, startTime: null };
    }
    const now = new Date();
    const startTime = new Date(session.startTime);
    return { now, startTime };
  },

  formatTime(now: Date, startTime: Date): string {
    const totalSeconds = Math.floor(
      (now.getTime() - startTime.getTime()) / 1000,
    );

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  },
};
