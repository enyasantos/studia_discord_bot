import { createActor, ActorRefFrom } from "xstate";
import { pomodoroMachine } from "./pomodoro.machine";

type ActorType = ActorRefFrom<typeof pomodoroMachine>;

class PomodoroManager {
  private sessions = new Map<string, ActorType>();

  private key(guildId: string, userId: string) {
    return `${guildId}:${userId}`;
  }

  create(guildId: string, userId: string) {
    const actor = createActor(pomodoroMachine).start();
    this.sessions.set(this.key(guildId, userId), actor);
    return actor;
  }

  get(guildId: string, userId: string) {
    return this.sessions.get(this.key(guildId, userId));
  }

  has(guildId: string, userId: string) {
    return this.sessions.has(this.key(guildId, userId));
  }

  delete(guildId: string, userId: string) {
    const actor = this.get(guildId, userId);
    actor?.stop();
    this.sessions.delete(this.key(guildId, userId));
  }

  stop(guildId: string, userId: string) {
    this.delete(guildId, userId);
  }
}

export default new PomodoroManager();
