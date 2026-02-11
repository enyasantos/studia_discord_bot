import { Events, GatewayIntentBits, Client } from "discord.js";
import * as dotenv from "dotenv";

import PingCommand from "./commands/utility/ping";
import UserCommand from "./commands/utility/user";
import TodoCommand from "./commands/utility/todo";

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  client.application?.commands.create(PingCommand.data);
  client.application?.commands.create(UserCommand.data);
  client.application?.commands.create(TodoCommand.data);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === PingCommand.data.name) {
    await PingCommand.execute(interaction);
  } else if (interaction.commandName === UserCommand.data.name) {
    await UserCommand.execute(interaction);
  } else if (interaction.commandName === TodoCommand.data.name) {
    await TodoCommand.execute(interaction);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
