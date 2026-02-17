import LevelsRepository from "../repositories/levels.repository.js";
import SessionRepository from "../repositories/session.repository.js";
import UsersRepository from "../repositories/users.repository.js";
import logger from "../config/logger.js";

class FinalizeSessionUseCase {
  public sessionRepository: typeof SessionRepository;
  public levelsRepository: typeof LevelsRepository;
  public usersRepository: typeof UsersRepository;

  constructor() {
    this.sessionRepository = SessionRepository;
    this.levelsRepository = LevelsRepository;
    this.usersRepository = UsersRepository;
  }

  async execute(discordId: string, guildId: string) {
    const user = await this.usersRepository.findUserByDiscordId(
      discordId,
      guildId,
    );
    if (!user) {
      throw new Error("User not found. Please register first.");
    }

    const session = await this.sessionRepository.endCurrentSession(user.id);
    if (!session) {
      logger.error(
        `[FinalizeSession] No active session found for user ${user.id}`,
      );
      return;
    }

    const { xpEarned } = session;
    const levelResult = await this.levelsRepository.addXp(user.id, xpEarned);

    logger.info(
      `Session finalized for user ${user.discordId} in guild ${guildId}`,
    );

    return {
      session,
      levelResult,
    };
  }
}

export default new FinalizeSessionUseCase();
