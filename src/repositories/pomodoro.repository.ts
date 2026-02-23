import PrismaService from "../services/database/prisma.service.js";

class PomodoroRepository {
  private prisma = PrismaService.getInstance();

  constructor() {}

  async create(data: {
    userId: string;
    mode: string;
    duration: number;
    endTime: Date;
    channelId: string;
  }) {
    return await this.prisma.pomodoroSession.create({
      data: {
        userId: data.userId,
        mode: data.mode,
        duration: data.duration,
        endTime: data.endTime,
        channelId: data.channelId,
      },
    });
  }

  async finish(sessionId: string, xpEarned: number) {
    return await this.prisma.pomodoroSession.update({
      where: { id: sessionId, status: "ACTIVE" },
      data: {
        endTime: new Date(),
        xpEarned,
        completed: true,
        status: "FINISHED",
      },
    });
  }

  async finishIfActive(sessionId: string, xpEarned: number) {
    const result = await this.prisma.pomodoroSession.updateMany({
      where: { id: sessionId, status: "ACTIVE" },
      data: {
        endTime: new Date(),
        xpEarned,
        completed: true,
        status: "FINISHED",
      },
    });

    return result.count > 0;
  }

  async cancel(sessionId: string) {
    return await this.prisma.pomodoroSession.update({
      where: { id: sessionId, status: "ACTIVE" },
      data: {
        status: "CANCELLED",
        endTime: new Date(),
        xpEarned: 0,
        completed: false,
      },
    });
  }

  async cancelIfActive(sessionId: string) {
    const result = await this.prisma.pomodoroSession.updateMany({
      where: { id: sessionId, status: "ACTIVE" },
      data: {
        status: "CANCELLED",
        endTime: new Date(),
        xpEarned: 0,
        completed: false,
      },
    });

    return result.count > 0;
  }

  async getActiveSession(userId: string) {
    return await this.prisma.pomodoroSession.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
    });
  }

  async findById(sessionId: string) {
    return await this.prisma.pomodoroSession.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: { id: true, discordId: true, guildId: true },
        },
      },
    });
  }

  async update(
    sessionId: string,
    endTime: Date,
    mode: string,
    completed: boolean,
    paused: boolean = false,
  ) {
    return await this.prisma.pomodoroSession.update({
      where: { id: sessionId },
      data: { endTime, mode, completed, paused },
    });
  }

  async findAllActive() {
    return await this.prisma.pomodoroSession.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: {
          select: { id: true, discordId: true, guildId: true },
        },
      },
    });
  }

  async findExpiredSessions() {
    return await this.prisma.pomodoroSession.findMany({
      where: {
        status: "ACTIVE",
        endTime: {
          lte: new Date(),
        },
        paused: false,
      },
      include: {
        user: {
          select: { id: true, discordId: true, guildId: true },
        },
      },
    });
  }

  async findPausedTimeoutSessions(timeoutMs: number) {
    const threshold = new Date(Date.now() - timeoutMs);

    return await this.prisma.pomodoroSession.findMany({
      where: {
        status: "ACTIVE",
        paused: true,
        updatedAt: {
          lte: threshold,
        },
      },
      include: {
        user: {
          select: { id: true, discordId: true, guildId: true },
        },
      },
    });
  }

  async saveSnapshot(data: {
    sessionId: string;
    stateValue: unknown;
    context: unknown;
    endTime: Date | null;
    paused: boolean;
    mode: string;
  }) {
    return this.prisma.pomodoroSession.update({
      where: { id: data.sessionId },
      data: {
        stateValue: data.stateValue as any,
        context: data.context as any,
        endTime: data.endTime ?? undefined,
        paused: data.paused,
        mode: data.mode,
      },
    });
  }
}

export default new PomodoroRepository();
