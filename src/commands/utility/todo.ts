import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} from "discord.js";

import TodoRepository from "../../repositories/todo.repository.js";
import UsersRepository from "../../repositories/users.repository.js";
import { UserNotFoundMessage } from "./shared/messages/user-not-found.message.js";

type Task = {
  id: string;
  name: string;
  description?: string | null;
  completed: boolean;
  xpEarned: number;
};

export default {
  data: new SlashCommandBuilder()
    .setName("todo")
    .setDescription("Gerencia suas tarefas")
    .addSubcommand((sub) =>
      sub
        .setName("criar")
        .setDescription("Cria uma tarefa")
        .addStringOption((opt) =>
          opt.setName("nome").setDescription("Nome").setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("descricao")
            .setDescription("Descrição")
            .setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName("listar").setDescription("Lista suas tarefas"),
    )
    .addSubcommand((sub) =>
      sub.setName("finalizar").setDescription("Finaliza uma tarefa"),
    )
    .addSubcommand((sub) =>
      sub.setName("resetar").setDescription("Reseta uma tarefa"),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const username = interaction.user.id;
    const guildId = interaction.guildId!;
    const user = await UsersRepository.findUserByDiscordId(username, guildId);

    if (!user) {
      const embed = UserNotFoundMessage.embed;
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (interaction.options.getSubcommand() === "create") {
      const name = interaction.options.getString("nome", true);
      const description =
        interaction.options.getString("descricao", false) || undefined;
      await TodoRepository.create(user.id, name, description);
      await this.handleRenderTodoEmbed(user.id, interaction);
    } else if (interaction.options.getSubcommand() === "list") {
      await this.handleRenderTodoEmbed(user.id, interaction);
    } else if (interaction.options.getSubcommand() === "finalizar") {
      const tasks = await this.handleGetAllTasks(user.id);

      const pending = tasks.filter((t) => !t.completed);

      if (!pending.length) {
        await interaction.reply({
          content: "Você não tem tarefas pendentes.",
          ephemeral: true,
        });
        return;
      }

      const select = new StringSelectMenuBuilder()
        .setCustomId("todo_finalize_select")
        .setPlaceholder("Selecione uma tarefa para finalizar")
        .addOptions(
          pending.slice(0, 25).map((task) => ({
            label: task.name.substring(0, 100),
            description: task.description?.substring(0, 100) || "Sem descrição",
            value: task.id,
          })),
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        select,
      );

      await interaction.reply({
        content: "Escolha a tarefa que deseja finalizar:",
        components: [row],
        ephemeral: true,
      });
    } else if (interaction.options.getSubcommand() === "resetar") {
      const tasks = await this.handleGetAllTasks(user.id);
      const completed = tasks.filter((t) => t.completed);

      if (!completed.length) {
        await interaction.reply({
          content: "Você não tem tarefas concluídas.",
          ephemeral: true,
        });
        return;
      }

      const select = new StringSelectMenuBuilder()
        .setCustomId("todo_reset_select")
        .setPlaceholder("Selecione uma tarefa para resetar")
        .addOptions(
          completed.slice(0, 25).map((task) => ({
            label: task.name.substring(0, 100),
            description: task.description?.substring(0, 100) || "Sem descrição",
            value: task.id,
          })),
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        select,
      );

      await interaction.reply({
        content:
          "Escolha a tarefa que deseja resetar (Obs.: Você perderá os XP ganhos):",
        components: [row],
        ephemeral: true,
      });
    }
  },

  async handleGetAllTasks(userId: string): Promise<Task[]> {
    const todos = await TodoRepository.list(userId);
    return todos;
  },

  async handleRenderTodoEmbed(
    userId: string,
    interaction: ChatInputCommandInteraction,
  ): Promise<void> {
    const tasks = await this.handleGetAllTasks(userId);

    if (tasks.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle("📝 Suas tarefas")
        .setDescription("Você não tem tarefas criadas.")
        .setColor(0x808080);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const total = tasks.length;

    const content = tasks
      .map((task) => {
        const status = task.completed ? "☑️" : "⬜";

        let line = `**${tasks.indexOf(task) + 1}.** ${status} **${task.name}** ${task.completed ? `(+${task.xpEarned} XP)` : ""}`;

        if (task.description) {
          line += `\n\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0└ ${task.description}`;
        }

        return line;
      })
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setTitle(`📝 Suas tarefas (${total})`)
      .setDescription(content)
      .setColor(0x2ecc71)
      .setTimestamp();
    await interaction.reply({
      embeds: [embed],
    });
  },
};
