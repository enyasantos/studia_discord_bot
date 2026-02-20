import pomodoroRepository from "../repositories/pomodoro.repository.js";
import pomodoroManager from "../commands/utility/pomodoro/pomodoro.manager.js";

// ...existing code...

class PomodoroRecoveryUsecase {
  async execute() {
    const sessions = await pomodoroRepository.findAllActive();

    for (const session of sessions) {
      const guildId = session.user.guildId;
      const discordUserId = session.user.discordId;

      const actor = pomodoroManager.create(guildId, discordUserId);

      actor.send({
        type: "HYDRATE",
        stateValue: (session.stateValue ?? "idle") as
          | "idle"
          | "breakDecision"
          | "breakEndDecision"
          | { focus: "running" | "paused" }
          | { break: "running" },
        context: (session.context ?? {}) as any,
      });
    }
  }
}

export default new PomodoroRecoveryUsecase();
