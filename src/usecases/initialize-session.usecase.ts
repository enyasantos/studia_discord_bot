import GuildRepository from "../repositories/guild.repository.js";
import LevelsRepository from "../repositories/levels.repository.js";
import SessionRepository from "../repositories/session.repository.js";
import UsersRepository from "../repositories/users.repository.js";
import logger from "../config/logger.js";

class InitializeSessionUseCase {
  public sessionRepository: typeof SessionRepository;
  public levelsRepository: typeof LevelsRepository;
  public usersRepository: typeof UsersRepository;
  public guildRepository: typeof GuildRepository;

  constructor() {
    this.sessionRepository = SessionRepository;
    this.levelsRepository = LevelsRepository;
    this.usersRepository = UsersRepository;
    this.guildRepository = GuildRepository;
  }

  async execute(userDiscordId: string, guildId: string) {
    const guildConfig = await this.guildRepository.getByGuildId(guildId);
    if (!guildConfig) {
      throw new Error(
        "Guild configuration not found. Please set up the guild first.",
      );
    }

    const user = await this.usersRepository.findUserByDiscordId(
      userDiscordId,
      guildId,
    );
    if (!user) {
      throw new Error("User not found. Please register first.");
    }

    const session = await this.sessionRepository.startNewSession(
      user.id,
      guildConfig.voiceChannelId,
    );
    if (!session) {
      throw new Error("Failed to start a new session for user");
    }

    logger.info(
      `Session started for user ${userDiscordId} in guild ${guildId}`,
    );

    return {
      session,
    };
  }

  async checkUserExists(userDiscordId: string, guildId: string) {
    const user = await this.usersRepository.findUserByDiscordId(
      userDiscordId,
      guildId,
    );
    return !!user;
  }
}

export default new InitializeSessionUseCase();
