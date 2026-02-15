import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";

const UPDATE_INTERVAL = 20_000;

export default {
  data: new SlashCommandBuilder()
    .setName("pomodoro")
    .setDescription(
      "Inicia um timer de pomodoro para ajudar na concentração e produtividade.",
    )
    .addIntegerOption((option) =>
      option
        .setName("minutes")
        .setDescription("Duração do pomodoro em minutos")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(180),
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const minutes = interaction.options.getInteger("minutes", true);

    let durationMs = minutes * 60 * 1000;
    let remainingMs = durationMs;
    let endTime = Date.now() + durationMs;
    let isPaused = false;
    let interval: NodeJS.Timeout;

    function progressBar(progress: number) {
      const total = 20;
      const filled = Math.round(progress * total);
      const empty = total - filled;
      return "▰".repeat(filled) + "▱".repeat(empty);
    }

    function createEmbed() {
      const progress = Math.min((durationMs - remainingMs) / durationMs, 1);

      const endsAt = Math.floor((Date.now() + remainingMs) / 1000);

      return new EmbedBuilder()
        .setColor(isPaused ? "#f1c40f" : "#ff4d4f")
        .setTitle(isPaused ? "⏸ Timer Pausado" : "🍅 Timer Pomodoro")
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(
          `**Termina em:** ${
            isPaused ? "Pausado" : `<t:${endsAt}:R>`
          }\n\n\`${progressBar(progress)}\` ${Math.floor(progress * 100)}%`,
        )
        .setFooter({ text: "Mantenha o foco 💪" });
    }

    function startInterval() {
      interval = setInterval(async () => {
        if (isPaused) return;

        remainingMs = endTime - Date.now();

        if (remainingMs <= 0) {
          clearInterval(interval);
          collector.stop();

          await message.edit({
            embeds: [
              new EmbedBuilder()
                .setColor("#2ecc71")
                .setTitle("✅ Timer Pomodoro Concluído")
                .setThumbnail(interaction.user.displayAvatarURL())
                .setDescription("Parabéns! Hora da pausa ☕")
                .setFooter({ text: "Mantenha o foco 💪" }),
            ],
            components: [],
          });

          return;
        }

        await message.edit({
          embeds: [createEmbed()],
        });
      }, UPDATE_INTERVAL);
    }

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("pause")
        .setLabel(isPaused ? "Retomar" : "Pausar")
        .setEmoji(isPaused ? "▶" : "⏸")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("stop")
        .setLabel("Stop")
        .setEmoji("🛑")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("add5")
        .setLabel("+5m")
        .setEmoji("⏱")
        .setStyle(ButtonStyle.Primary),
    );

    const message = await interaction.reply({
      embeds: [createEmbed()],
      components: [row],
      fetchReply: true,
    });

    startInterval();

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: "Esse timer não é seu 👀",
          ephemeral: true,
        });
      }

      if (i.customId === "stop") {
        clearInterval(interval);
        collector.stop();

        await i.update({
          embeds: [
            new EmbedBuilder()
              .setColor("#e74c3c")
              .setTitle("🛑 Timer Pomodoro Parado")
              .setThumbnail(interaction.user.displayAvatarURL())
              .setFooter({ text: "Mantenha o foco 💪" }),
          ],
          components: [],
        });
      } else if (i.customId === "add5") {
        const extra = 5 * 60 * 1000;
        durationMs += extra;
        remainingMs += extra;
        endTime += extra;

        await i.reply({
          content: "⏱ +5 minutos adicionados!",
          ephemeral: true,
        });
      } else if (i.customId === "pause") {
        if (!isPaused) {
          isPaused = true;
          remainingMs = endTime - Date.now();
          clearInterval(interval);
        } else {
          isPaused = false;
          endTime = Date.now() + remainingMs;
          startInterval();
        }

        await i.update({
          embeds: [createEmbed()],
          components: [row],
        });
      }
    });
  },
};
