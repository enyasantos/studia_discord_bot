import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import sessionService from "../../services/session.service.js";

export default {
  data: new SlashCommandBuilder()
    .setName("tempo")
    .setDescription(
      "Mostra o tempo total que você passou estudando no canal de voz.",
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const { embed, row } = await this.build(
      interaction.user.id,
      interaction.guild?.id || "",
    );
    await interaction.reply({ embeds: [embed], components: [row] });
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
        .setTitle("📊 • SESSÃO ATUAL")
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
      console.log(`No active session found for user ${discordId}`);
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
