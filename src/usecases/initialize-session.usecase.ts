import LevelsService from "../services/levels.service.js";
import SessionService from "../services/session.service.js";
import UsersService from "../services/users.service.js";

class InitializeSessionUseCase {
  public sessionService: typeof SessionService;
  public levelsService: typeof LevelsService;
  public usersService: typeof UsersService;

  constructor() {
    this.sessionService = SessionService;
    this.levelsService = LevelsService;
    this.usersService = UsersService;
  }

  async execute(discordId: string, channelId: string) {
    const user = await this.usersService.findUserByDiscordId(discordId);
    if (!user) {
      throw new Error("User not found. Please register first.");
    }

    const session = await this.sessionService.startNewSession(
      user.id,
      channelId,
    );
    if (!session) {
      throw new Error("Failed to start a new session for user");
    }

    return {
      session,
    };
  }

  async checkUserExists(discordId: string) {
    const user = await this.usersService.findUserByDiscordId(discordId);
    return !!user;
  }
}

export default new InitializeSessionUseCase();
