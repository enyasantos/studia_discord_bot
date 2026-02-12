import { Events, GatewayIntentBits, Client, TextChannel } from "discord.js";
import * as dotenv from "dotenv";

import PingCommand from "./commands/utility/ping.js";
import UserCommand from "./commands/utility/user.js";
import TodoCommand from "./commands/utility/todo.js";
import RegisterCommand from "./commands/utility/register.js";
import finalizeSessionUsecase from "./usecases/finalize-session.usecase.js";
import initializeSessionUsecase from "./usecases/initialize-session.usecase.js";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.on(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  client.application?.commands.create(PingCommand.data);
  client.application?.commands.create(UserCommand.data);
  client.application?.commands.create(TodoCommand.data);
  client.application?.commands.create(RegisterCommand.data);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === PingCommand.data.name) {
    await PingCommand.execute(interaction);
  } else if (interaction.commandName === UserCommand.data.name) {
    await UserCommand.execute(interaction);
  } else if (interaction.commandName === TodoCommand.data.name) {
    await TodoCommand.execute(interaction);
  } else if (interaction.commandName === RegisterCommand.data.name) {
    await RegisterCommand.execute(interaction);
  }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const channelName = "studia";
  const oldChannelName = oldState.channel?.name;
  const newChannelName = newState.channel?.name;

  if (newChannelName !== channelName && oldChannelName !== channelName) {
    return;
  }

  const userExists = await initializeSessionUsecase.checkUserExists(
    newState.member!.user.id,
  );
  if (!userExists) {
    const user = newState?.member?.user ||
      oldState?.member?.user || { id: "unknown" };
    const massage = `<@${user.id}> tentou entrar no canal de voz "${channelName}", mas não está registrado. Use o comando /register para se registrar e ganhar XP por estudar!`;
    const guild = newState.guild;
    if (!guild) return;

    const textChannel = guild.channels.cache.find((ch) => ch.isTextBased()) as
      | TextChannel
      | undefined;

    if (textChannel) {
      await textChannel.send(massage.slice(0, 2000)); // limite de 2000 caracteres
    }
  }

  if (
    newChannelName === channelName &&
    !oldState.channelId &&
    newState.channelId
  ) {
    // Check if the user has joined a voice channel
    console.log(
      `${newState.member?.user.tag} joined voice channel ${newState.channel?.name}`,
    );

    await initializeSessionUsecase.execute(
      newState.member!.user.id,
      newState.channelId!,
    );

    const message = `<@${newState.member?.user.id}> começou a estudar! Bons estudos! 📚`;

    // Enviar para qualquer canal de texto disponível
    const guild = newState.guild;
    if (!guild) return;

    const textChannel = guild.channels.cache.find((ch) => ch.isTextBased()) as
      | TextChannel
      | undefined;

    if (textChannel) {
      await textChannel.send(message.slice(0, 2000)); // limite de 2000 caracteres
    }
  }

  // Check if the user has left a voice channel
  else if (
    oldChannelName === channelName &&
    oldState.channelId &&
    !newState.channelId
  ) {
    console.log(
      `${oldState.member?.user.tag} left voice channel ${oldState.channel?.name}`,
    );
    const response = await finalizeSessionUsecase.execute(
      newState.member!.user.id,
    );

    if (!response) return;

    const start = new Date(response.session.startTime);
    const end = new Date(response.session.endTime!);
    const minutesStudied = Math.floor(
      (end.getTime() - start.getTime()) / 60000,
    );

    const message = `<@${oldState.member?.user.id}> ganhou ${response.session.xpEarned} XP por estudar por ${minutesStudied} minutos!`;

    // Enviar para qualquer canal de texto disponível
    const guild = newState.guild;
    if (!guild) return;

    const textChannel = guild.channels.cache.find((ch) => ch.isTextBased()) as
      | TextChannel
      | undefined;

    if (textChannel) {
      await textChannel.send(message.slice(0, 2000)); // limite de 2000 caracteres
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
