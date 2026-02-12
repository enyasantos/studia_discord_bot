import GuildService from "../services/guild.service.js";
import LevelsService from "../services/levels.service.js";
import SessionService from "../services/session.service.js";
import UsersService from "../services/users.service.js";

class InitializeSessionUseCase {
  public sessionService: typeof SessionService;
  public levelsService: typeof LevelsService;
  public usersService: typeof UsersService;
  public guildService: typeof GuildService;

  constructor() {
    this.sessionService = SessionService;
    this.levelsService = LevelsService;
    this.usersService = UsersService;
    this.guildService = GuildService;
  }

  async execute(userDiscordId: string, guildId: string) {
    const guildConfig = await this.guildService.getByGuildId(guildId);
    if (!guildConfig) {
      throw new Error(
        "Guild configuration not found. Please set up the guild first.",
      );
    }

    const user = await this.usersService.findUserByDiscordId(
      userDiscordId,
      guildId,
    );
    if (!user) {
      throw new Error("User not found. Please register first.");
    }

    const session = await this.sessionService.startNewSession(
      user.id,
      guildConfig.voiceChannelId,
    );
    if (!session) {
      throw new Error("Failed to start a new session for user");
    }

    return {
      session,
    };
  }

  async checkUserExists(userDiscordId: string, guildId: string) {
    const user = await this.usersService.findUserByDiscordId(
      userDiscordId,
      guildId,
    );
    return !!user;
  }
}

export default new InitializeSessionUseCase();
