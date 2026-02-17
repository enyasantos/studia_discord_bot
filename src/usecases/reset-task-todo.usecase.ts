import todoRepository from "../repositories/todo.repository.js";
import levelsRepository from "../repositories/levels.repository.js";
import usersRepository from "../repositories/users.repository.js";

class ResetTaskTodoUseCase {
  constructor() {}

  async execute(userDiscordId: string, guildId: string, taskId: string) {
    const user = await usersRepository.findUserByDiscordId(
      userDiscordId,
      guildId,
    );
    if (!user) {
      throw new Error("User not found");
    }

    const updated = await todoRepository.update(taskId, 0, false);
    await levelsRepository.removeXp(user.id, updated.oldXpEarned);
  }
}

export default new ResetTaskTodoUseCase();
