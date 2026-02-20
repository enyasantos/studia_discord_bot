import todoRepository from "../repositories/todo.repository.js";
import levelsRepository from "../repositories/levels.repository.js";
import usersRepository from "../repositories/users.repository.js";
import pomodoroRepository from "../repositories/pomodoro.repository.js";
import XP_CONFIG from "../config/xp-config.js";

class FinalizeTaskTodoUseCase {
  constructor() {}

  async execute(userDiscordId: string, guildId: string, taskId: string) {
    const user = await usersRepository.findUserByDiscordId(
      userDiscordId,
      guildId,
    );
    if (!user) {
      throw new Error("User not found");
    }

    const pomodoro = await pomodoroRepository.getActiveSession(user.id);
    const xpEarned = pomodoro
      ? XP_CONFIG.TODO_EARNED_XP * 1.5
      : XP_CONFIG.TODO_EARNED_XP;

    await todoRepository.update(taskId, xpEarned, true);
    await levelsRepository.addXp(user.id, xpEarned);
  }
}

export default new FinalizeTaskTodoUseCase();
