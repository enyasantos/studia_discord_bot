import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  Message,
  EmbedBuilder,
} from "discord.js";

import pomodoroManager from "./pomodoro.manager.js";
import {
  focusEmbed,
  breakEmbed,
  focusButtons,
  breakDecisionButtons,
  breakEndButtons,
} from "./pomodoro.ui.js";
import usersRepository from "../../../repositories/users.repository.js";
import levelsRepository from "../../../repositories/levels.repository.js";
import { UserNotFoundMessage } from "../shared/messages/user-not-found.message.js";
import pomodoroRepository from "../../../repositories/pomodoro.repository.js";
import XP_CONFIG from "../../../config/xp-config.js";

const NODE_ENV = process.env.NODE_ENV || "DEVELOPMENT";

export default {
  data: new SlashCommandBuilder()
    .setName("pomodoro")
    .setDescription("Inicia um Pomodoro")
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Minutos de foco")
        .setRequired(true)
        .setMinValue(NODE_ENV === "DEVELOPMENT" ? 1 : 10)
        .setMaxValue(60),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const minutes = interaction.options.getInteger("minutes", true);
    const guildId = interaction.guildId!;
    const discordUserId = interaction.user.id;

    const dbUser = await usersRepository.findUserByDiscordId(
      discordUserId,
      guildId,
    );
    if (!dbUser) {
      return interaction.reply({
        embeds: [UserNotFoundMessage.embed],
        ephemeral: true,
      });
    }

    const hasInMemory = pomodoroManager.has(guildId, discordUserId);
    const activeSession = await pomodoroRepository.getActiveSession(dbUser.id);

    if (hasInMemory && !activeSession) {
      pomodoroManager.delete(guildId, discordUserId);
    }

    if (hasInMemory || activeSession) {
      console.log(
        `Has in memory: ${hasInMemory}, active session in DB: ${activeSession}`,
      );
      return interaction.reply({
        content: "Você já possui um Pomodoro ativo 🍅",
        ephemeral: true,
      });
    }

    let sessionId: string | null = null;
    const actor = pomodoroManager.create(guildId, discordUserId);
    actor.send({ type: "START", duration: minutes * 60 * 1000 });

    const message = (await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#16c751")
          .setTitle("🍅 Iniciando Pomodoro..."),
      ],
      fetchReply: true,
    })) as Message;

    const createFocusSession = async () => {
      const snapshot = actor.getSnapshot();
      const created = await pomodoroRepository.create({
        userId: dbUser.id,
        mode: "FOCUS",
        duration: snapshot.context.focusDuration,
        endTime: new Date(snapshot.context.endsAt ?? Date.now()),
        channelId: interaction.channelId ?? "unknown",
      });
      sessionId = created.id;
    };

    await createFocusSession();

    const persistSnapshot = async () => {
      if (!sessionId) return;
      const s = actor.getSnapshot();
      const paused = s.matches("focus.paused");
      const mode = s.matches("break.running") ? "BREAK" : "FOCUS";
      await pomodoroRepository.saveSnapshot({
        sessionId,
        stateValue: s.value,
        context: s.context,
        endTime: s.context.endsAt ? new Date(s.context.endsAt) : null,
        paused,
        mode,
      });
    };

    type EditPayload = Parameters<Message["edit"]>[0];

    let rendering = false;
    let pendingRender: { key: string; payload: EditPayload } | null = null;
    let lastAppliedRenderKey: string | null = null;

    const flushRender = async () => {
      if (rendering) return;
      rendering = true;

      try {
        while (pendingRender) {
          const current = pendingRender;
          pendingRender = null;

          if (current.key === lastAppliedRenderKey) continue;

          await message.edit(current.payload);
          lastAppliedRenderKey = current.key;
        }
      } finally {
        rendering = false;
      }
    };

    const queueRender = (key: string, payload: EditPayload) => {
      pendingRender = { key, payload };
      void flushRender();
    };

    actor.subscribe(async (snapshot) => {
      const ctx = snapshot.context;

      if (snapshot.matches("focus.running")) {
        queueRender(
          `focus.running:${Math.ceil(ctx.remainingTime / 1000)}:${ctx.endsAt ? Math.floor(ctx.endsAt / 1000) : "null"}`,
          {
            embeds: [
              focusEmbed(ctx.remainingTime, ctx.focusDuration, ctx.endsAt),
            ],
            components: [focusButtons(false)],
          },
        );
      }

      if (snapshot.matches("focus.paused")) {
        queueRender(`focus.paused:${Math.ceil(ctx.remainingTime / 1000)}`, {
          embeds: [
            focusEmbed(ctx.remainingTime, ctx.focusDuration, ctx.endsAt),
          ],
          components: [focusButtons(true)],
        });
      }

      if (snapshot.matches("breakDecision")) {
        if (sessionId) {
          await persistSnapshot();

          const finalized = await pomodoroRepository.finishIfActive(
            sessionId,
            XP_CONFIG.POMODORO_EARNED_XP,
          );

          if (finalized) {
            await levelsRepository.addXp(
              dbUser.id,
              XP_CONFIG.POMODORO_EARNED_XP,
            );
          }

          sessionId = null;
        }

        queueRender("breakDecision", {
          embeds: [
            new EmbedBuilder()
              .setColor("#2ecc71")
              .setTitle("🍅 Pomodoro Concluído!")
              .setDescription(
                `Você ganhou ${XP_CONFIG.POMODORO_EARNED_XP} XP por concluir seu ciclo de foco!
                \n\n Escolha sua pausa 👇`,
              )
              .setFooter({
                text: "Após o descanso, clique em 'Novo Foco' para iniciar um novo ciclo.",
              }),
          ],
          components: [breakDecisionButtons()],
        });
      }

      if (snapshot.matches("break.running")) {
        queueRender(
          `break.running:${Math.ceil(ctx.remainingTime / 1000)}:${ctx.endsAt ? Math.floor(ctx.endsAt / 1000) : "null"}`,
          {
            embeds: [
              breakEmbed(ctx.remainingTime, ctx.breakDuration, ctx.endsAt),
            ],
            components: [],
          },
        );
      }

      if (snapshot.matches("breakEndDecision")) {
        queueRender("breakEndDecision", {
          embeds: [
            new EmbedBuilder()
              .setTitle("🍅 Novo ciclo?")
              .setDescription("Clique abaixo para continuar."),
          ],
          components: [breakEndButtons()],
        });
      }

      if (snapshot.matches("idle")) {
        queueRender("idle", {
          embeds: [new EmbedBuilder().setTitle("🍅 Pomodoro Encerrado")],
          components: [],
        });

        sessionId = null;

        pomodoroManager.delete(guildId, discordUserId);
      }
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== discordUserId)
        return i.reply({ content: "Esse timer não é seu 👀", ephemeral: true });

      await i.deferUpdate();
      switch (i.customId) {
        case "PAUSE":
          const snapshot = actor.getSnapshot();
          if (snapshot.matches("focus.running")) {
            actor.send({ type: "PAUSE" });
          } else if (snapshot.matches("focus.paused")) {
            actor.send({ type: "RESUME" });
          }
          break;
        case "RESUME":
          const resumeSnapshot = actor.getSnapshot();
          actor.send({ type: "RESUME" });

          if (resumeSnapshot.matches("breakEndDecision")) {
            await createFocusSession();
          }
          break;

        case "ADD_TIME":
          actor.send({ type: "ADD_TIME", amount: 5 * 60 * 1000 });
          break;

        case "CANCEL":
          actor.send({ type: "CANCEL" });
          if (sessionId) {
            await pomodoroRepository.cancelIfActive(sessionId);
            await persistSnapshot();
            sessionId = null;
          }
          break;

        case "BREAK_5":
          actor.send({ type: "BREAK_5" });
          break;

        case "BREAK_15":
          actor.send({ type: "BREAK_15" });
          break;
      }
      await persistSnapshot();
    });
  },
};
