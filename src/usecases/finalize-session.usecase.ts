import LevelsService from "../services/levels.service.js";
import SessionService from "../services/session.service.js";
import UsersService from "../services/users.service.js";

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
      console.error("No active session found for user");
      return;
    }

    const { xpEarned } = session;
    const levelResult = await this.levelsService.addXp(user.id, xpEarned);

    return {
      session,
      levelResult,
    };
  }
}

export default new FinalizeSessionUseCase();
