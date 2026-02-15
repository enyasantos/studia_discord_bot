import PrismaService from "./database/prisma.service.js";

class PomodoroRepository {
  private prisma = PrismaService.getInstance();

  constructor() {}

  async create(userId: string, mode: string, duration: number) {
    return await this.prisma.pomodoroSession.create({
      data: {
        userId,
        mode,
        duration,
      },
    });
  }

  async finish(sessionId: string, xpEarned: number, completed: boolean) {
    return await this.prisma.pomodoroSession.update({
      where: { id: sessionId },
      data: { endTime: new Date(), xpEarned, completed },
    });
  }

  async getActiveSession(userId: string) {
    return await this.prisma.pomodoroSession.findFirst({
      where: {
        userId,
        endTime: null,
      },
    });
  }
}

export default new PomodoroRepository();
