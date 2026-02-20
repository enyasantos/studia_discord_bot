import pomodoroRepository from "../repositories/pomodoro.repository";
import levelsRepository from "../repositories/levels.repository";
import { Client, EmbedBuilder } from "discord.js";
import pomodoroManager from "../commands/utility/pomodoro/pomodoro.manager";
import logger from "../config/logger";
import XP_CONFIG from "../config/xp-config";

export function startPomodoroWorker(client: Client) {
  let isProcessing = false;

  const processExpiredSessions = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const expiredSessions = await pomodoroRepository.findExpiredSessions();

      if (expiredSessions.length > 0) {
        logger.info(
          `[PomodoroWorker] ${expiredSessions.length} sessões expiradas encontradas`,
        );
      }

      for (const session of expiredSessions) {
        if (session.paused) continue;

        try {
          const xpEarned =
            session.mode === "FOCUS" ? XP_CONFIG.POMODORO_EARNED_XP : 0;

          const finalized = await pomodoroRepository.finishIfActive(
            session.id,
            xpEarned,
          );

          if (!finalized) {
            continue;
          }

          if (xpEarned > 0) {
            await levelsRepository.addXp(session.userId, xpEarned);
          }

          pomodoroManager.stop(session.user.guildId, session.user.discordId);

          const guild = await client.guilds.fetch(session.user.guildId);
          const channel = await guild.channels.fetch(session.channelId);

          if (!channel?.isTextBased()) continue;

          if (session.mode === "FOCUS") {
            await channel.send({
              content: `<@${session.user.discordId}>`,
              embeds: [
                new EmbedBuilder()
                  .setColor("#2ecc71")
                  .setTitle("🎉 Foco concluído!"),
              ],
            });
          } else {
            await channel.send({
              content: `<@${session.user.discordId}>`,
              embeds: [
                new EmbedBuilder()
                  .setColor("#9b59b6")
                  .setTitle("☕ Descanso finalizado!"),
              ],
            });
          }
        } catch (err) {
          logger.error(
            { error: err, session },
            "(Worker) Error on pomodoro completion handling",
          );
        }
      }
    } finally {
      isProcessing = false;
    }
  };

  void processExpiredSessions();
  setInterval(() => {
    void processExpiredSessions();
  }, 5_000);
}
