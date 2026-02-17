import PrismaService from "../services/database/prisma.service.js";

class TodoRepository {
  private prisma = PrismaService.getInstance();

  constructor() {}

  async create(
    userId: string,
    name: string,
    description?: string,
    completed: boolean = false,
  ) {
    return await this.prisma.task.create({
      data: {
        userId,
        name,
        description,
        completed,
      },
    });
  }

  async remove(taskId: string) {
    return await this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  async update(taskId: string, xpEarned: number, completed: boolean) {
    const existingTask = await this.prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask) throw new Error("Task não encontrada");

    const oldXpEarned = existingTask.xpEarned;
    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: { xpEarned, completed },
    });

    return {
      ...updatedTask,
      oldXpEarned,
    };
  }

  async list(userId: string) {
    return await this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }
}

export default new TodoRepository();
