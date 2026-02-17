import GuildRepository from "../repositories/guild.repository.js";

class GuildConfigurationUseCase {
  public guildRepository: typeof GuildRepository;

  constructor() {
    this.guildRepository = GuildRepository;
  }

  async execute(
    guildId: string,
    categoryId: string,
    textChannelId: string,
    voiceChannelId: string,
  ) {
    return await this.guildRepository.upsert(
      guildId,
      categoryId,
      textChannelId,
      voiceChannelId,
    );
  }
}

export default new GuildConfigurationUseCase();
