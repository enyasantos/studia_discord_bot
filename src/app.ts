import {
  Events,
  GatewayIntentBits,
  Client,
  TextChannel,
  ChannelType,
  PermissionsBitField,
  Guild,
  VoiceState,
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
import PomodoroCommand from "./commands/utility/pomodoro.js";

import finalizeSessionUsecase from "./usecases/finalize-session.usecase.js";
import initializeSessionUsecase from "./usecases/initialize-session.usecase.js";
import guildConfigurationUseCase from "./usecases/guild-configuration.usecase.js";
import getGuildConfigurationUseCase from "./usecases/get-guild-configuration.usecase.js";

dotenv.config();

const PrismaService = await import("./services/database/prisma.service.js");
await PrismaService.default.connect();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

client.on(Events.Error, (error) => {
  console.error("Erro no cliente Discord:", error);
});

client.on(Events.GuildCreate, async (guild) => {
  try {
    console.log(`Fui adicionado ao servidor: ${guild.name}`);

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

    console.log(`Cargo criado: ${botRole.name}`);

    const botMember = guild.members.me;
    if (botMember) {
      await botMember.roles.add(
        botRole,
        "Ativando permissões necessárias para o bot",
      );
      console.log("Cargo atribuído ao bot!");
    }
  } catch (error) {
    console.error("Erro ao configurar o servidor:", error);
  }
});

client.on(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

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
        console.log(
          `Comando não encontrado para: ${interaction.commandName} ${command}`,
        );
        return interaction.reply({
          content: "❌ Comando não reconhecido.",
          ephemeral: true,
        });
      }

      await command.execute(interaction);
    } catch (error) {
      console.error(`Erro ao executar /${interaction.commandName}`, error);

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
        console.error("Erro ao salvar configuração do servidor:", error);
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

  const userExists = await initializeSessionUsecase.checkUserExists(
    newState.member!.user.id,
    newState.guild!.id,
  );
  if (!userExists) {
    const user = newState?.member?.user ||
      oldState?.member?.user || { id: "unknown" };

    const message = `<@${user.id}>, você precisa se registrar usando o comando /register antes de usar os canais de voz de estudo. Por favor, registre-se para começar a ganhar XP!`;
    await sendMessage(guild, message, guildConfig.textChannelId);
  }

  if (!oldState.channelId && newState.channelId) {
    console.log(
      `${newState.member?.user.tag} joined voice channel ${newState.channel?.name}`,
    );
    await initializeSessionInGuild(
      oldState,
      newState,
      guildConfig.textChannelId,
    );
  } else if (oldState.channelId && !newState.channelId) {
    console.log(
      `${oldState.member?.user.tag} left voice channel ${oldState.channel?.name}`,
    );
    await finalizeSessionInGuild(oldState, newState, guildConfig.textChannelId);
  } else {
    console.log(
      `${newState.member?.user.tag} switched from voice channel ${oldState.channel?.name} to ${newState.channel?.name}`,
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
  await sendMessage(newState.guild!, message, textChannelId);
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

  const start = new Date(response.session.startTime);
  const end = new Date(response.session.endTime!);
  const minutesStudied = Math.floor((end.getTime() - start.getTime()) / 60000);

  const message = `<@${oldState.member?.user.id}> ganhou ${response.session.xpEarned} XP por estudar por ${minutesStudied} minutos!`;
  await sendMessage(oldState.guild!, message, textChannelId);
}

async function sendMessage(
  guild: Guild,
  message: string,
  textChannelId?: string,
) {
  if (!guild) return;

  const textChannel = textChannelId
    ? (guild.channels.cache.get(textChannelId) as TextChannel | undefined)
    : (guild.channels.cache.find((ch) => ch.isTextBased()) as
        | TextChannel
        | undefined);

  if (textChannel) {
    await textChannel.send(message.slice(0, 2000));
  }
}

client.login(process.env.DISCORD_BOT_TOKEN);
