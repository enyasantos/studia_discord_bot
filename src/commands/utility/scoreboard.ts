import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import levelsService from "../../services/levels.service.js";
import { getRankTitle } from "./shared/rank-title-by-level.js";

export default {
  data: new SlashCommandBuilder()
    .setName("placar")
    .setDescription("Mostra o placar de XP do servidor."),

  async execute(interaction: ChatInputCommandInteraction) {
    const guildId = interaction.guildId;
    const userDiscordId = interaction.user.id;
    if (!guildId) {
      await interaction.reply("Este comando só pode ser usado em servidores.");
      return;
    }

    const levels = await levelsService.getAllLevelsByGuild(guildId);
    if (levels.length === 0) {
      await interaction.reply(
        "Nenhum dado de XP encontrado para este servidor.",
      );
      return;
    }
    const rankingText = levels
      .slice(0, 10)
      .map((item, index) => {
        const icon = this.getRankIcon(index);

        if (item.userId === userDiscordId) {
          return `👉 **${icon} ${item.user.username} — Lv ${item.level} [${getRankTitle(item.level)}] — ⭐ ${item.xp} XP ** 👈`;
        }

        return `${icon} ${item.user.username} — Lv ${item.level} [${getRankTitle(item.level)}] — ⭐ ${item.xp} XP`;
      })
      .join("\n");

    const userIndex = levels.findIndex(
      (item) => item.user.discordId === userDiscordId,
    );

    const user = levels[userIndex];

    const embed = new EmbedBuilder()
      .setAuthor({
        name: `Visualizando ranking do servidor • [ ${user?.user.username ?? "Usuário"} ] • ${userIndex + 1}`,
      })
      .setTitle("🏆 Ranking do Servidor")
      .setDescription("**Pontuação Geral — Todos os Tempos**\n")
      .addFields(
        {
          name: "💬 Seu Ranking",
          value: `Você está em **#${userIndex + 1}º lugar** neste servidor\ncom um total de **${user?.xp ?? 0} XP** ⭐`,
        },
        {
          name: "🏆 Classificação",
          value: rankingText,
        },
      )
      .setColor(0xf1c40f)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  getRankIcon(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  },
};
