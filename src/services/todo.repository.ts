import PrismaService from "./database/prisma.service.js";

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

  async update(taskId: string, completed: boolean) {
    return await this.prisma.task.update({
      where: { id: taskId },
      data: { completed },
    });
  }

  async list(userId: string) {
    return await this.prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }
}

export default new TodoRepository();
