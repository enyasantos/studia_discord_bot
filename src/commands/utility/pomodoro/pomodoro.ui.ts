import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export function focusEmbed(
  remaining: number,
  total: number,
  endsAtTimestamp: number | null,
) {
  const progress =
    total > 0 ? Math.min(1, Math.max(0, (total - remaining) / total)) : 0;
  const endsAt = endsAtTimestamp ? Math.floor(endsAtTimestamp / 1000) : null;

  return new EmbedBuilder()
    .setColor("#ff4d4f")
    .setTitle("🍅 Foco")
    .setThumbnail("https://cataas.com/cat?type=square")
    .setDescription(
      `${endsAt ? `**Termina em:** <t:${endsAt}:R>\n\n` : `⏸️ Pausado\n\n`}` +
        `\`${progressBar(progress)}\` ${Math.floor(progress * 100)}%`,
    );
}

export function breakEmbed(
  remaining: number,
  total: number,
  endsAtTimestamp: number | null,
) {
  const progress =
    total > 0 ? Math.min(1, Math.max(0, (total - remaining) / total)) : 0;
  const endsAt = endsAtTimestamp ? Math.floor(endsAtTimestamp / 1000) : null;

  return new EmbedBuilder()
    .setColor("#3498db")
    .setTitle("☕ Pausa")
    .setThumbnail("https://cataas.com/cat?type=square")
    .setDescription(
      `${endsAt ? `**Termina em:** <t:${endsAt}:R>\n\n` : `⏸️ Pausado\n\n`}` +
        `\`${progressBar(progress)}\` ${Math.floor(progress * 100)}%`,
    );
}

export function focusButtons(paused: boolean) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("PAUSE")
      .setLabel(paused ? "Retomar" : "Pausar")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ADD_TIME")
      .setLabel("+5m")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("CANCEL")
      .setLabel("Parar")
      .setStyle(ButtonStyle.Danger),
  );
}

export function breakDecisionButtons() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("BREAK_5")
      .setLabel("Pausa 5m")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("BREAK_15")
      .setLabel("Pausa 15m")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("CANCEL")
      .setLabel("Encerrar")
      .setStyle(ButtonStyle.Danger),
  );
}

export function breakEndButtons() {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("RESUME")
      .setLabel("Novo Foco")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("CANCEL")
      .setLabel("Encerrar")
      .setStyle(ButtonStyle.Danger),
  );
}

function progressBar(progress: number) {
  const total = 20;
  const safeProgress = Math.min(1, Math.max(0, progress));
  const filled = Math.round(safeProgress * total);
  return "▰".repeat(filled) + "▱".repeat(total - filled);
}
