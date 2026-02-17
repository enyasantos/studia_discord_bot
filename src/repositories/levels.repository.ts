import PrismaService from "../services/database/prisma.service.js";

class LevelsRepository {
  private prisma = PrismaService.getInstance();

  constructor() {}

  async create(userId: string) {
    return await this.prisma.level.create({
      data: {
        userId,
        level: 1,
        xp: 0,
      },
    });
  }

  async getByUserId(userId: string) {
    return await this.prisma.level.findUnique({
      where: {
        userId,
      },
    });
  }

  async addXp(userId: string, xpToAdd: number) {
    const levelData = await this.getByUserId(userId);
    if (!levelData) {
      throw new Error("Level data not found for user");
    }

    const newXp = levelData.xp + xpToAdd;
    let newLevel = this.calculateLevel(newXp);

    await this.prisma.level.update({
      where: {
        userId,
      },
      data: {
        xp: newXp,
        level: newLevel,
      },
    });

    return {
      levelUp: newLevel > levelData.level,
      newLevel,
      oldLevel: levelData.level,
      totalXp: newXp,
    };
  }

  async removeXp(userId: string, xpToRemove: number) {
    const levelData = await this.getByUserId(userId);
    if (!levelData) {
      throw new Error("Level data not found for user");
    }

    const newXp = Math.max(0, levelData.xp - xpToRemove);
    let newLevel = this.calculateLevel(newXp);

    await this.prisma.level.update({
      where: {
        userId,
      },
      data: {
        xp: newXp,
        level: newLevel,
      },
    });

    return {
      levelUp: newLevel < levelData.level,
      newLevel,
      oldLevel: levelData.level,
      totalXp: newXp,
    };
  }

  async getAllLevelsByGuild(guildId: string) {
    return await this.prisma.level.findMany({
      where: {
        user: {
          guildId,
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        xp: "desc",
      },
    });
  }

  private calculateLevel(totalXP: number): number {
    const XP_PER_LEVEL = 50; // This is a base value to control leveling speed
    return Math.floor(Math.pow(totalXP / XP_PER_LEVEL, 0.8)) + 1;
  }
}

export default new LevelsRepository();
