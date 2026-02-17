import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "Mostra a lista de comandos disponíveis e suas descrições.",
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const commandsList = [
      {
        name: "/help",
        description: "Mostra a lista de comandos disponíveis e suas descrições",
      },
      { name: "/ping", description: "Responde com Pong!" },
      {
        name: "/configurar",
        description: "Exibe o card de gerenciamento de canais",
      },
      {
        name: "/registrar",
        description: "Registra você no sistema de XP/Level do bot",
      },
      {
        name: "/tempo",
        description:
          "Mostra seu tempo estudado (sessão atual, última ou total)",
      },
      {
        name: "/nivel",
        description: "Mostra seu nível, XP e título atual no servidor",
      },
      { name: "/placar", description: "Mostra o placar de XP do servidor" },
      { name: "/ranks", description: "Mostra a tabela de ranks e níveis" },
      {
        name: "/todo",
        description: "Gerencia tarefas (criar, listar, finalizar, resetar)",
      },
      {
        name: "/pomodoro",
        description: "Inicia um ciclo Pomodoro",
      },
    ];

    const description = commandsList
      .map((cmd) => `**${cmd.name}**\n> ${cmd.description}`)
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setTitle("📚 Central de Ajuda — Comandos do Bot")
      .setDescription(description)
      .addFields({
        name: "🎯 Iniciando uma sessão de estudo",
        value:
          "É simples:\n" +
          "1️⃣ Use **/configurar** para criar os canais automáticos\n" +
          "2️⃣ Entre no canal de voz criado\n\n" +
          "**Por padrão:** `Estudo` → `canal-de-voz`\n\n" +
          "✨ Pronto! Sua sessão começa **automaticamente** assim que você entrar no canal.",
      })
      .setColor(0x5865f2)
      .setFooter({
        text: "Use os comandos acima para interagir comigo! Bons estudos 🚀",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
