import LevelsService from "../services/levels.service.js";
import SessionService from "../services/session.service.js";
import UsersService from "../services/users.service.js";
import logger from "../config/logger.js";

class FinalizeSessionUseCase {
  public sessionService: typeof SessionService;
  public levelsService: typeof LevelsService;
  public usersService: typeof UsersService;

  constructor() {
    this.sessionService = SessionService;
    this.levelsService = LevelsService;
    this.usersService = UsersService;
  }

  async execute(discordId: string, guildId: string) {
    const user = await this.usersService.findUserByDiscordId(
      discordId,
      guildId,
    );
    if (!user) {
      throw new Error("User not found. Please register first.");
    }

    const session = await this.sessionService.endCurrentSession(user.id);
    if (!session) {
      logger.error(
        `[FinalizeSession] No active session found for user ${user.id}`,
      );
      return;
    }

    const { xpEarned } = session;
    const levelResult = await this.levelsService.addXp(user.id, xpEarned);

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
