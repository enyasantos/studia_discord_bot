import PrismaService from "./database/prisma.service.js";

class UsersService {
  private prisma = PrismaService.getInstance();

  constructor() {}

  async findUserByDiscordId(discordId: string) {
    return await this.prisma.user.findUnique({
      where: {
        discordId,
      },
      include: {
        level: true,
      },
    });
  }

  async upsertUser(discordId: string, username: string) {
    return await this.prisma.user.upsert({
      where: {
        discordId,
      },
      update: {
        username,
        updatedAt: new Date(),
      },
      create: {
        discordId,
        username,
      },
    });
  }
}

export default new UsersService();
