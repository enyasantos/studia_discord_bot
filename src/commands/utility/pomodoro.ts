import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Message,
} from "discord.js";

import ffmpegPath from "ffmpeg-static";

import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} from "@discordjs/voice";

import path from "path";

if (ffmpegPath) {
  process.env.FFMPEG_PATH = ffmpegPath;
}

import pomodoroRepository from "../../repositories/pomodoro.repository.js";
import userRepository from "../../repositories/users.repository.js";
import levelRepository from "../../repositories/levels.repository.js";
import pomodoroManager from "../managers/pomodoro.manager.js";

import logger from "../../config/logger.js";

type Mode = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";
const NODE_ENV = process.env.NODE_ENV || "DEVELOPMENT";

const SHORT_BREAK = (NODE_ENV === "DEVELOPMENT" ? 1 : 5) * 60 * 1000;
const LONG_BREAK = (NODE_ENV === "DEVELOPMENT" ? 2 : 15) * 60 * 1000;
const UPDATE_INTERVAL = 5000;
const XP_PER_POMODORO = 50;

export default {
  data: new SlashCommandBuilder()
    .setName("pomodoro")
    .setDescription("Inicia um ciclo Pomodoro.")
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Duração do foco em minutos")
        .setRequired(true)
        .setMinValue(NODE_ENV === "DEVELOPMENT" ? 1 : 10)
        .setMaxValue(60),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const user = interaction.user;
      const mention = `<@${user.id}>`;

      if (pomodoroManager.has(interaction.guildId!, user.id)) {
        return interaction.reply({
          content: "Você já possui um Pomodoro ativo 🍅",
          ephemeral: true,
        });
      }

      const baseMinutes = interaction.options.getInteger("minutes", true);

      let mode: Mode = "FOCUS";
      let durationMs = baseMinutes * 60 * 1000;
      let remainingMs = durationMs;
      let endTime = Date.now() + durationMs;
      let isPaused = false;

      let interval: NodeJS.Timeout | null = null;
      let message: Message;

      /* ===================== USUÁRIO ===================== */

      const userDatabase = await userRepository.findUserByDiscordId(
        user.id,
        interaction.guildId!,
      );

      if (!userDatabase) {
        await interaction.reply({
          content:
            "Usuário não encontrado no banco de dados. Use /start primeiro.",
          ephemeral: true,
        });
        return;
      }

      /* ===================== UTILS ===================== */

      const safeEdit = async (data: any) => {
        try {
          if (!message) return;
          await message.edit(data);
        } catch (err) {
          logger.error({ err }, "[Pomodoro] safeEdit");
        }
      };

      /* ===================== SESSION ===================== */

      let currentPomodoroSession: { id: string } | null =
        await pomodoroRepository.getActiveSession(userDatabase.id);

      const createPomodoroSession = async () => {
        const session = await pomodoroRepository.create(
          userDatabase.id,
          mode,
          durationMs,
        );
        currentPomodoroSession = session;
      };

      const finalizeSession = async (completed: boolean) => {
        if (!currentPomodoroSession) return;

        const xpEarned = completed ? XP_PER_POMODORO : 0;

        await pomodoroRepository.finish(
          currentPomodoroSession.id,
          xpEarned,
          completed,
        );

        if (xpEarned > 0) {
          await levelRepository.addXp(userDatabase.id, xpEarned);

          try {
            await interaction.followUp({
              embeds: [
                new EmbedBuilder()
                  .setColor("#ffb6c1")
                  .setTitle(`🎉 Parabéns ${user.username}!`)
                  .setDescription(
                    `✨ Você ganhou **${xpEarned} XP** por completar o Pomodoro.`,
                  )
                  .setThumbnail(
                    "https://cataas.com/cat/says/Parab%C3%A9ns?type=square",
                  )
                  .setFooter({
                    text: "Continue focando para evoluir ainda mais 🚀",
                  }),
              ],
              ephemeral: true,
            });
          } catch (err) {
            logger.error({ err }, "[Pomodoro] Erro ao enviar XP embed");
          }
        }

        currentPomodoroSession = null;
      };

      /* ===================== SOM ===================== */

      const playSound = async (fileName: string) => {
        try {
          const member = await interaction.guild?.members.fetch(user.id);
          const channel = member?.voice.channel;
          if (!channel) return;

          const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: false,
          });

          await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

          const player = createAudioPlayer();
          const resource = createAudioResource(
            path.join(process.cwd(), "src", "sounds", fileName),
          );

          connection.subscribe(player);
          player.play(resource);

          player.on(AudioPlayerStatus.Idle, () => {
            setTimeout(() => connection.destroy(), 1000);
          });

          player.on("error", () => {
            connection.destroy();
          });

          connection.on("error", () => {
            connection.destroy();
          });

          const safetyTimeout = setTimeout(
            () => {
              if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
              }
            },
            5 * 60 * 1000,
          );

          // Clean up connection on error or if it gets stuck
          connection.on(VoiceConnectionStatus.Destroyed, () => {
            clearTimeout(safetyTimeout);
          });
        } catch (error) {
          logger.error({ err: error }, "[Pomodoro] Erro ao tocar som");
        }
      };

      /* ===================== TIMER ===================== */

      const clearTimer = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };

      const progressBar = (progress: number) => {
        const total = 20;
        const filled = Math.round(progress * total);
        return "▰".repeat(filled) + "▱".repeat(total - filled);
      };

      const createEmbed = () => {
        const progress = Math.min((durationMs - remainingMs) / durationMs, 1);
        const endsAt = Math.floor((Date.now() + remainingMs) / 1000);

        return new EmbedBuilder()
          .setColor(mode === "FOCUS" ? "#ff4d4f" : "#3498db")
          .setTitle(mode === "FOCUS" ? "🍅 Foco" : "☕ Pausa")
          .setThumbnail("https://cataas.com/cat?type=square")
          .setDescription(
            `**Termina em:** ${
              isPaused ? "Pausado" : `<t:${endsAt}:R>`
            }\n\n\`${progressBar(progress)}\` ${Math.floor(progress * 100)}%`,
          );
      };

      const focusControlsRow = () =>
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("pause")
            .setLabel(isPaused ? "Retomar" : "Pausar")
            .setEmoji(isPaused ? "▶" : "⏸")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("add5")
            .setLabel("+5m")
            .setEmoji("⏱")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("stop")
            .setLabel("Parar")
            .setEmoji("🛑")
            .setStyle(ButtonStyle.Danger),
        );

      const breakOptionsRow = () =>
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("shortBreak")
            .setLabel("Pausa 5m")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("longBreak")
            .setLabel("Pausa 15m")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("stop")
            .setLabel("Finalizar")
            .setStyle(ButtonStyle.Danger),
        );

      const onBreakControlsRow = () =>
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("pause")
            .setLabel(isPaused ? "Retomar" : "Pausar")
            .setEmoji(isPaused ? "▶" : "⏸")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("stop")
            .setLabel("Finalizar")
            .setStyle(ButtonStyle.Danger),
        );

      const startFocusRow = () =>
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("startFocus")
            .setLabel("Iniciar Foco")
            .setEmoji("▶")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId("stop")
            .setLabel("Cancelar")
            .setStyle(ButtonStyle.Danger),
        );

      if (!currentPomodoroSession) {
        await createPomodoroSession();
      }

      message = (await interaction.reply({
        embeds: [createEmbed()],
        components: [focusControlsRow()],
        fetchReply: true,
      })) as Message;

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
      });

      const startTimer = () => {
        clearTimer();

        interval = setInterval(async () => {
          if (isPaused) return;

          remainingMs = endTime - Date.now();

          if (remainingMs <= 0) {
            clearTimer();

            if (mode === "FOCUS") {
              await finalizeSession(true);
              await playSound("focus_end.mp3");

              await safeEdit({
                embeds: [
                  new EmbedBuilder()
                    .setColor("#2ecc71")
                    .setTitle("🎉 Pomodoro Concluído!")
                    .setThumbnail("https://cataas.com/cat?type=square")
                    .setDescription("Escolha sua pausa abaixo 👇"),
                ],
                components: [breakOptionsRow()],
              });

              return;
            }

            // fim da pausa → volta foco automaticamente
            await playSound("break_end.mp3");

            mode = "FOCUS";
            durationMs = baseMinutes * 60 * 1000;
            remainingMs = durationMs;
            isPaused = true;

            await safeEdit({
              embeds: [
                new EmbedBuilder()
                  .setColor("#ff4d4f")
                  .setTitle("🍅 Pronto para novo foco?")
                  .setDescription(
                    "Clique em ▶ para iniciar o próximo Pomodoro.",
                  ),
              ],
              components: [startFocusRow()],
            });

            return;
          }

          await safeEdit({
            embeds: [createEmbed()],
            components:
              mode === "FOCUS" ? [focusControlsRow()] : [onBreakControlsRow()],
          });
        }, UPDATE_INTERVAL);

        pomodoroManager.set(interaction.guildId!, user.id, {
          interval,
          collector,
        });
      };

      startTimer();

      if (interval) {
        pomodoroManager.set(interaction.guildId!, user.id, {
          interval,
          collector,
        });
      }

      logger.info(
        `[Pomodoro] Iniciado para ${user.username} (${user.id}) no servidor ${interaction.guildId} por ${baseMinutes} minutos.`,
      );

      collector.on("end", async (_, reason) => {
        clearTimer();

        pomodoroManager.delete(interaction.guildId!, user.id);

        if (reason !== "user_stop") {
          try {
            await finalizeSession(false);
          } catch (err) {
            logger.error({ err }, "[Pomodoro] Erro ao finalizar sessão");
          }
        }
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== user.id)
          return i.reply({
            content: "Esse timer não é seu 👀",
            ephemeral: true,
          });

        if (i.customId === "pause") {
          await i.deferUpdate();
          isPaused = !isPaused;

          if (!isPaused) {
            endTime = Date.now() + remainingMs;
            startTimer();
          } else {
            clearTimer();
          }

          try {
            await i.update({
              embeds: [createEmbed()],
              components:
                mode === "FOCUS"
                  ? [focusControlsRow()]
                  : [onBreakControlsRow()],
            });
          } catch (err) {
            logger.error({ err }, "[Pomodoro] Erro ao atualizar interação");
          }
        } else if (i.customId === "add5" && mode === "FOCUS") {
          await i.deferUpdate();
          remainingMs += 5 * 60 * 1000;
          endTime += 5 * 60 * 1000;

          try {
            await i.update({
              embeds: [createEmbed()],
              components: [focusControlsRow()],
            });
          } catch (err) {
            logger.error({ err }, "[Pomodoro] Erro ao atualizar interação");
          }
        } else if (i.customId === "stop") {
          await i.deferUpdate();
          pomodoroManager.stop(interaction.guildId!, user.id);

          await finalizeSession(false);

          try {
            await i.update({
              embeds: [
                new EmbedBuilder()
                  .setColor("#e74c3c")
                  .setTitle("🛑 Timer Encerrado")
                  .setDescription(
                    `O ciclo foi finalizado, ${mention}.
                \nInfelizmente, você não ganhou XP desta vez, mas não desanime! Cada tentativa é um passo a mais rumo à sua produtividade ideal.
                \n\nAté a próxima! 👋`,
                  )
                  .setThumbnail("https://cataas.com/cat?type=square"),
              ],
              components: [],
            });
          } catch (err) {
            logger.error({ err }, "[Pomodoro] Erro ao atualizar interação");
          }
        } else if (i.customId === "shortBreak") {
          await i.deferUpdate();
          mode = "SHORT_BREAK";
          durationMs = SHORT_BREAK;
          remainingMs = durationMs;
          endTime = Date.now() + durationMs;
          isPaused = false;

          await safeEdit({
            embeds: [createEmbed()],
            components: [onBreakControlsRow()],
          });

          startTimer();
        } else if (i.customId === "longBreak") {
          await i.deferUpdate();
          mode = "LONG_BREAK";
          durationMs = LONG_BREAK;
          remainingMs = durationMs;
          endTime = Date.now() + durationMs;
          isPaused = false;

          await safeEdit({
            embeds: [createEmbed()],
            components: [onBreakControlsRow()],
          });

          startTimer();
        } else if (i.customId === "startFocus") {
          await i.deferUpdate();
          isPaused = false;

          endTime = Date.now() + remainingMs;

          await createPomodoroSession();

          await i.update({
            embeds: [createEmbed()],
            components: [focusControlsRow()],
          });

          startTimer();
        }
      });
    } catch (error) {
      logger.error({ err: error }, "[Pomodoro] Erro geral");

      pomodoroManager.stop(interaction.guildId!, interaction.user.id);

      const errorEmbed = new EmbedBuilder()
        .setColor("#fc0303")
        .setTitle("⚠️ Oops! Algo deu errado...")
        .setDescription(
          `😿 Tivemos um pequeno problema ao iniciar seu Pomodoro.\n\n` +
            `🔄 Tente novamente em alguns instantes.\n\n` +
            `🛠️ Se o erro continuar, entre em contato com o suporte.`,
        )
        .setFooter({
          text: "Obrigado pela paciência! Estamos sempre melhorando 🚀",
        })
        .setTimestamp();

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            embeds: [errorEmbed],
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            embeds: [errorEmbed],
            ephemeral: true,
          });
        }
      } catch (err) {
        logger.error({ err }, "[Pomodoro] Falha ao enviar mensagem de erro");
      }
    }
  },
};
