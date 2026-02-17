import { EmbedBuilder } from "discord.js";

export const UserNotFoundMessage = {
  embed: new EmbedBuilder()
    .setTitle("👤 Usuário não encontrado")
    .setDescription(
      "Usuário não encontrado no banco de dados. Use /register primeiro.",
    )
    .setColor("#eb0e0e"),
};
