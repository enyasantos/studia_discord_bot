function getRankTitle(level: number) {
  if (level <= 0) return "Iniciante";

  const tiers = [
    "Bronze",
    "Prata",
    "Ouro",
    "Platina",
    "Diamante",
    "Campeao",
    "Mestre",
  ];

  if (level >= 100) return "Lenda";

  const levelsPorTier = 14;
  const tierIndex = Math.floor((level - 1) / levelsPorTier);

  const subTierSize = Math.floor(levelsPorTier / 3);
  const romanIndex = Math.floor(((level - 1) % levelsPorTier) / subTierSize);
  const roman = ["I", "II", "III"][romanIndex];

  return `${tiers[tierIndex]} ${roman}`;
}

export { getRankTitle };
