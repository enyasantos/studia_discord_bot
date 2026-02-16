type PomodoroRuntime = {
  interval: NodeJS.Timeout;
  collector: any;
};

class PomodoroManager {
  private sessions = new Map<string, PomodoroRuntime>();

  private makeKey(guildId: string, userId: string) {
    return `${guildId}:${userId}`;
  }

  has(guildId: string, userId: string) {
    return this.sessions.has(this.makeKey(guildId, userId));
  }

  set(guildId: string, userId: string, data: PomodoroRuntime) {
    this.sessions.set(this.makeKey(guildId, userId), data);
  }

  stop(guildId: string, userId: string) {
    const key = this.makeKey(guildId, userId);
    const session = this.sessions.get(key);

    if (!session) return;

    clearInterval(session.interval);
    session.collector.stop("manager_stop");

    this.sessions.delete(key);
  }

  delete(guildId: string, userId: string) {
    this.sessions.delete(this.makeKey(guildId, userId));
  }
}

export default new PomodoroManager();
