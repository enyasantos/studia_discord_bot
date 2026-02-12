import {
  EmbedBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ranks")
    .setDescription("Mostra a tabela de ranks e níveis"),

  async execute(interaction: ChatInputCommandInteraction) {
    // Tabela de ranks
    const ranks = [
      { range: "1-5", rank: "Bronze I" },
      { range: "6-9", rank: "Bronze II" },
      { range: "10-14", rank: "Bronze III" },
      { range: "15-19", rank: "Prata I" },
      { range: "20-23", rank: "Prata II" },
      { range: "24-28", rank: "Prata III" },
      { range: "29-33", rank: "Ouro I" },
      { range: "34-37", rank: "Ouro II" },
      { range: "38-42", rank: "Ouro III" },
      { range: "43-47", rank: "Platina I" },
      { range: "48-51", rank: "Platina II" },
      { range: "52-56", rank: "Platina III" },
      { range: "57-61", rank: "Diamante I" },
      { range: "62-65", rank: "Diamante II" },
      { range: "66-70", rank: "Diamante III" },
      { range: "71-75", rank: "Campeao I" },
      { range: "76-79", rank: "Campeao II" },
      { range: "80-84", rank: "Campeao III" },
      { range: "85-89", rank: "Mestre I" },
      { range: "90-93", rank: "Mestre II" },
      { range: "94-99", rank: "Mestre III" },
      { range: "100+", rank: "Lenda" },
    ];

    // Cria embed
    const embed = new EmbedBuilder()
      .setTitle("🏆 Tabela de Ranks")
      .setDescription("Veja os níveis correspondentes a cada rank")
      .setColor(0xffd700) // dourado
      .setFooter({ text: "Level progressivo até Lenda" });

    // Adiciona cada rank como um campo
    ranks.forEach((r) => {
      embed.addFields({
        name: r.rank,
        value: `Levels: ${r.range}`,
        inline: true,
      });
    });

    // Envia embed
    await interaction.reply({ embeds: [embed] });
  },
};
