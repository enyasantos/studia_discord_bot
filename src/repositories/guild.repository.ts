import PrismaService from "../services/database/prisma.service.js";

class GuildRepository {
  private prisma = PrismaService.getInstance();
  constructor() {}

  async upsert(
    guildId: string,
    categoryId: string,
    textChannelId: string,
    voiceChannelId: string,
  ) {
    return await this.prisma.guildConfig.upsert({
      where: {
        guildId,
      },
      update: {
        categoryId,
        textChannelId,
        voiceChannelId,
        updatedAt: new Date(),
      },
      create: {
        categoryId,
        textChannelId,
        voiceChannelId,
        guildId,
      },
    });
  }

  async getByGuildId(guildId: string) {
    return await this.prisma.guildConfig.findUnique({
      where: {
        guildId,
      },
    });
  }
}

export default new GuildRepository();
