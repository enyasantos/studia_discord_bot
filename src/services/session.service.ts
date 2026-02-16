import PrismaService from "./database/prisma.service.js";

class SessionService {
  private prisma = PrismaService.getInstance();
  private MAX_SESSION_DURATION_MINUTES = 120; // 2 hours
  constructor() {}

  async startNewSession(userId: string, channelId: string) {
    return await this.prisma.session.create({
      data: {
        userId,
        channelId,
      },
    });
  }

  async getCurrentSession(discordId: string, guildId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        discord_guild_unique: {
          discordId,
          guildId,
        },
      },
    });
    if (!user) {
      return null;
    }

    return await this.prisma.session.findFirst({
      where: {
        userId: user.id,
        endTime: null,
      },
    });
  }

  async endCurrentSession(userId: string) {
    const endTime = new Date();
    const currentSession = await this.prisma.session.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });
    if (!currentSession) {
      return null;
    }

    let xpEarned = this.calculateSessionXP(currentSession.startTime, endTime);

    return await this.prisma.session.update({
      where: { id: currentSession.id },
      data: { endTime: endTime, xpEarned },
    });
  }

  private calculateSessionXP(start: Date, end: Date): number {
    const totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);

    if (totalMinutes <= 0) return 0;
    if (totalMinutes <= 10) return 15;
    if (totalMinutes <= 20) return 50;
    if (totalMinutes <= 40) return 100;
    if (totalMinutes <= 60) return 150;
    if (totalMinutes <= this.MAX_SESSION_DURATION_MINUTES) return 200;
    return 200;
  }
}

export default new SessionService();
