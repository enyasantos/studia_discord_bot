import PrismaService from "../services/database/prisma.service.js";

class UsersRepository {
  private prisma = PrismaService.getInstance();

  constructor() {}

  async findUserByDiscordId(discordId: string, guildId: string) {
    return await this.prisma.user.findUnique({
      where: {
        discord_guild_unique: {
          discordId,
          guildId,
        },
      },
      include: {
        level: true,
      },
    });
  }

  async upsertUser(discordId: string, username: string, guildId: string) {
    return await this.prisma.user.upsert({
      where: {
        discord_guild_unique: {
          discordId,
          guildId,
        },
      },
      update: {
        username,
        updatedAt: new Date(),
      },
      create: {
        discordId,
        username,
        guildId,
      },
    });
  }
}

export default new UsersRepository();
