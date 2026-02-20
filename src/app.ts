import {
  Events,
  GatewayIntentBits,
  Client,
  TextChannel,
  ChannelType,
  PermissionsBitField,
  Guild,
  VoiceState,
  EmbedBuilder,
} from "discord.js";
import * as dotenv from "dotenv";

import PingCommand from "./commands/utility/ping.js";
import LevelCommand from "./commands/utility/level.js";
import TodoCommand from "./commands/utility/todo.js";
import RegisterCommand from "./commands/utility/register.js";
import InitializeCommand from "./commands/utility/initialize.js";
import TimeCommand from "./commands/utility/time.js";
import RankCommand from "./commands/utility/rank.js";
import ScoreboardCommand from "./commands/utility/scoreboard.js";
import CommandsCommand from "./commands/utility/commands.js";
import PomodoroCommand from "./commands/utility/pomodoro/pomodoro.command.js";

import finalizeSessionUsecase from "./usecases/finalize-session.usecase.js";
import initializeSessionUsecase from "./usecases/initialize-session.usecase.js";
import guildConfigurationUseCase from "./usecases/guild-configuration.usecase.js";
import getGuildConfigurationUseCase from "./usecases/get-guild-configuration.usecase.js";
import resetTaskTodoUseCase from "./usecases/reset-task-todo.usecase.js";
import finalizeTaskTodoUsercase from "./usecases/finalize-task-todo.usercase.js";

import logger from "./config/logger.js";
import pomodoroRecoveryUsecase from "./usecases/pomodoro-recovery.usecase.js";
import { startPomodoroWorker } from "./workers/pomodoro.worker.js";

dotenv.config();

const PrismaService = await import("./services/database/prisma.service.js");
await PrismaService.default.connect();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.on("unhandledRejection", (reason) => {
  logger.error("[Client] Unhandled Rejection:", reason);
});

client.on(Events.Error, (error) => {
  logger.error({ err: error }, "[Client] Error");
});

client.on(Events.GuildCreate, async (guild) => {
  try {
    logger.info(`[Client] Fui adicionado ao servidor: ${guild.name}`);

    const botRole = await guild.roles.create({
      name: "StudiaBot",
      color: "Blue",
      permissions: [
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageRoles,
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
      ],
      reason: "Cargo necessário para o bot funcionar corretamente",
    });

    logger.info(`[Client] Cargo criado: ${botRole.name}`);

    const botMember = guild.members.me;
    if (botMember) {
      await botMember.roles.add(
        botRole,
        "Ativando permissões necessárias para o bot",
      );
      logger.info("[Client] Cargo atribuído ao bot!");
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        { err: error },
        "[Client] Erro desconhecido ao salvar configuração",
      );
    } else {
      logger.error(
        { err: new Error(String(error)) },
        "[Client] Erro desconhecido ao salvar configuração",
      );
    }
  }
});

client.on(Events.ClientReady, async (readyClient) => {
  logger.info(`[Client] Ready! Logged in as ${readyClient.user.tag}`);

  startPomodoroWorker(client);

  client.application?.commands.create(PingCommand.data);
  client.application?.commands.create(LevelCommand.data);
  client.application?.commands.create(TodoCommand.data);
  client.application?.commands.create(RegisterCommand.data);
  client.application?.commands.create(InitializeCommand.data);
  client.application?.commands.create(TimeCommand.data);
  client.application?.commands.create(RankCommand.data);
  client.application?.commands.create(ScoreboardCommand.data);
  client.application?.commands.create(CommandsCommand.data);
  client.application?.commands.create(PomodoroCommand.data);

  await pomodoroRecoveryUsecase.execute();
});

client.on(Events.InteractionCreate, async (interaction) => {
  const mapper = {
    ping: PingCommand,
    nivel: LevelCommand,
    todo: TodoCommand,
    registrar: RegisterCommand,
    configurar: InitializeCommand,
    tempo: TimeCommand,
    ranks: RankCommand,
    placar: ScoreboardCommand,
    help: CommandsCommand,
    pomodoro: PomodoroCommand,
  };

  if (interaction.isChatInputCommand()) {
    try {
      const command = mapper[interaction.commandName as keyof typeof mapper];

      if (!command) {
        logger.warn(
          `[Client] Comando não encontrado para: ${interaction.commandName}`,
        );
        return interaction.reply({
          content: "❌ Comando não reconhecido.",
          ephemeral: true,
        });
      }

      await command.execute(interaction);
    } catch (error) {
      if (error instanceof Error) {
        logger.error({ err: error }, "[Client] Erro ao executar comando");
      } else {
        logger.error(
          { err: new Error(String(error)) },
          "[Client] Erro desconhecido ao executar comando",
        );
      }

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "⚠️ Ocorreu um erro ao executar este comando.",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "⚠️ Ocorreu um erro ao executar este comando.",
          ephemeral: true,
        });
      }
    }
  }

  if (interaction.isButton()) {
    const buttonId = interaction.customId;

    if (buttonId === "refresh_session") {
      const { embed, row } = await TimeCommand.build(
        interaction.user.id,
        interaction.guild?.id!,
      );
      await interaction.update({ embeds: [embed], components: [row] });
    } else if (buttonId === "configure_dynamic_voices") {
      const guild = interaction.guild;
      if (!guild) return;

      if (
        !guild.members.me?.permissions.has(
          PermissionsBitField.Flags.ManageChannels,
        )
      ) {
        return interaction.reply({
          content:
            "❌ Não tenho permissão para criar canais neste servidor. Por favor, me dê a permissão de 'Gerenciar Canais'.",
          ephemeral: true,
        });
      }

      const categoryName = "Estudos";
      const textChannelName = "estudo-texto";
      const voiceChannelName = "estudo-voz";

      const category = await guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.roles.everyone, // todos os membros
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
        ],
      });

      const textChannel = await guild.channels.create({
        name: textChannelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
            ],
          },
        ],
      });

      const voiceChannel = await guild.channels.create({
        name: voiceChannelName,
        type: ChannelType.GuildVoice,
        parent: category.id,
        userLimit: 10, // optional
      });

      const data = {
        categoryId: category.id,
        textChannelId: textChannel.id,
        voiceChannelId: voiceChannel.id,
      };

      const guildId = interaction.guildId;

      try {
        await guildConfigurationUseCase.execute(
          guildId!,
          data.categoryId,
          data.textChannelId,
          data.voiceChannelId,
        );
        await interaction.reply({
          content: `Categoria "${category.name}" criada com sucesso com os canais: ${textChannel} e ${voiceChannel}`,
          ephemeral: true,
        });
      } catch (error) {
        if (error instanceof Error) {
          logger.error(
            { err: error },
            "[Client] Erro ao salvar configuração do servidor",
          );
        } else {
          logger.error(
            { err: new Error(String(error)) },
            "[Client] Erro desconhecido ao salvar configuração",
          );
        }

        await category.delete(
          "Removendo categoria devido a erro na configuração do servidor",
        );

        await textChannel.delete(
          "Removendo canal de texto devido a erro na configuração do servidor",
        );

        await voiceChannel.delete(
          "Removendo canal de voz devido a erro na configuração do servidor",
        );
        await interaction.reply({
          content: `Ocorreu um erro ao salvar a configuração do servidor. Por favor, tente novamente mais tarde.`,
          ephemeral: true,
        });
      }
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "todo_finalize_select") {
    const taskId = interaction.values[0];

    await finalizeTaskTodoUsercase.execute(
      interaction.user.id,
      interaction.guildId!,
      taskId,
    );

    await interaction.update({
      content: "✅ Tarefa finalizada com sucesso!",
      components: [],
    });
  }
  if (interaction.customId === "todo_reset_select") {
    const taskId = interaction.values[0];

    await resetTaskTodoUseCase.execute(
      interaction.user.id,
      interaction.guildId!,
      taskId,
    );

    await interaction.update({
      content: "✅ Tarefa resetada com sucesso!",
      components: [],
    });
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const oldChannelId = oldState.channel?.id;
  const newChannelId = newState.channel?.id;

  const guild = newState.guild || oldState.guild;

  const guildConfig = await getGuildConfigurationUseCase.execute(guild.id);
  if (!guildConfig) return;

  if (
    newChannelId !== guildConfig.voiceChannelId &&
    oldChannelId !== guildConfig.voiceChannelId
  )
    return;

  const userIdBot = guild.members.me?.user.id;
  if (newState.member?.user.id === userIdBot) return;

  const userExists = await initializeSessionUsecase.checkUserExists(
    newState.member!.user.id,
    newState.guild!.id,
  );

  if (!userExists) {
    const user = newState?.member?.user ||
      oldState?.member?.user || { id: "unknown" };

    const message = `<@${user.id}>, você precisa se registrar usando o comando /register antes de usar os canais de voz de estudo.
    \nPor favor, registre-se para começar a ganhar XP!`;
    const embed = new EmbedBuilder()
      .setTitle("‼️ Registro Necessário")
      .setColor("DarkRed")
      .setDescription(message);
    await sendMessage(guild, embed, guildConfig.textChannelId);
  }

  if (!oldState.channelId && newState.channelId) {
    logger.info(
      `[Client] ${newState.member?.user.tag} joined voice channel ${newState.channel?.name}`,
    );
    await initializeSessionInGuild(
      oldState,
      newState,
      guildConfig.textChannelId,
    );
  } else if (oldState.channelId && !newState.channelId) {
    logger.info(
      `[Client] ${oldState.member?.user.tag} left voice channel ${oldState.channel?.name}`,
    );
    await finalizeSessionInGuild(oldState, newState, guildConfig.textChannelId);
  } else {
    logger.info(
      `[Client] ${newState.member?.user.tag} switched from voice channel ${oldState.channel?.name} to ${newState.channel?.name}`,
    );
    await finalizeSessionInGuild(oldState, newState, guildConfig.textChannelId);
  }
});

async function initializeSessionInGuild(
  oldState: VoiceState,
  newState: VoiceState,
  textChannelId?: string,
) {
  await initializeSessionUsecase.execute(
    newState.member!.user.id,
    newState.guild!.id,
  );

  const message = `<@${newState.member?.user.id}> começou a estudar! Bons estudos! 📚`;
  const embed = new EmbedBuilder()
    .setTitle("🎯 Sessão Inicializada")
    .setColor("Blue")
    .setDescription(message);
  await sendMessage(newState.guild!, embed, textChannelId);
}

async function finalizeSessionInGuild(
  oldState: VoiceState,
  newState: VoiceState,
  textChannelId?: string,
) {
  const response = await finalizeSessionUsecase.execute(
    newState.member!.user.id,
    newState.guild!.id,
  );

  if (!response) return;

  if (response.levelResult.levelUp) {
    const message = `<@${response.session.userId}> subiu de nível! \nParabéns! Continue assim! 🎉`;
    const embed = new EmbedBuilder()
      .setTitle("🏆 Subiu de Nível!")
      .setColor("Green")
      .setDescription(message);
    await sendMessage(oldState.guild!, embed, textChannelId);
  }

  const start = new Date(response.session.startTime);
  const end = new Date(response.session.endTime!);
  const minutesStudied = Math.floor((end.getTime() - start.getTime()) / 60000);

  const message = `✨ <@${oldState.member?.user.id}> ganhou ${response.session.xpEarned} XP por estudar por ${minutesStudied} minutos!
  \n📈 Nível Atual: ${response.levelResult.newLevel} (XP Total: ${response.levelResult.totalXp})`;
  const embed = new EmbedBuilder()
    .setTitle("✅ Sessão Finalizada")
    .setColor("Yellow")
    .setDescription(message);
  await sendMessage(oldState.guild!, embed, textChannelId);
}

async function sendMessage(
  guild: Guild,
  embed: EmbedBuilder,
  textChannelId?: string,
) {
  if (!guild) return;

  const textChannel = textChannelId
    ? (guild.channels.cache.get(textChannelId) as TextChannel | undefined)
    : (guild.channels.cache.find((ch) => ch.isTextBased()) as
        | TextChannel
        | undefined);

  if (textChannel) {
    // await textChannel.send(message.slice(0, 2000));
    await textChannel.send({
      embeds: [embed],
    });
  }
}

client.login(process.env.DISCORD_BOT_TOKEN);
