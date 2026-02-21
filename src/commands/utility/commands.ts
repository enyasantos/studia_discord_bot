import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
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
      .setColor(0x5865f2)
      .addFields({
        name: "🎯 Iniciando uma sessão de estudo",
        value:
          "É simples:\n" +
          "1️⃣ Use **/configurar** para criar os canais automáticos\n" +
          "2️⃣ Entre no canal de voz criado\n\n" +
          "**Por padrão:** `Estudo` → `canal-de-voz`\n\n" +
          "✨ Pronto! Sua sessão começa **automaticamente** assim que você entrar no canal.",
      })
      .addFields({
        name: "⭐ Ganhando XP — 3 Formas Principais",
        value:
          "Existem várias maneiras de ganhar experiência e subir de nível!",
      })
      .addFields({
        name: "1️⃣ Sessões de Voz",
        value:
          "Ganhe XP por estar em um canal de voz:\n" +
          "• **Até 10 min:** 15 XP\n" +
          "• **11-20 min:** 50 XP\n" +
          "• **21-40 min:** 100 XP\n" +
          "• **41-60 min:** 150 XP\n" +
          "• **Acima de 60 min (máx 120 min):** 200 XP\n\n" +
          "💡 Inicie uma sessão entrando no canal de voz específico — o XP é calculado automaticamente ao sair!",
        inline: false,
      })
      .addFields({
        name: "2️⃣Pomodoro",
        value:
          "Complete ciclos Pomodoro (técnica de produtividade):\n" +
          "• **Ciclo completo:** 50 XP\n" +
          "• **Ciclo incompleto:** 0 XP\n\n" +
          "💡 Use **/pomodoro [minutos]** para iniciar. Conclua o tempo para ganhar XP!",
        inline: false,
      })
      .addFields({
        name: "3️⃣ Tarefas (TODO)",
        value:
          "Crie e conclua tarefas com **/todo**:\n" +
          "• **Tarefa normal:** 50 XP\n" +
          "• **Tarefa durante Pomodoro ativo:** 75 XP (bônus de 50%)\n\n" +
          "💡 Finalize suas tarefas com `/todo finalizar` para ganhar XP. Se resetar, perde tudo!",
        inline: false,
      })
      .setFooter({
        text: "Use os comandos acima para interagir comigo! Bons estudos 🚀",
      })
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
