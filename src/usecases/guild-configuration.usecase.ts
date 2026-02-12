import GuildService from "../services/guild.service";

class GuildConfigurationUseCase {
  public guildService: typeof GuildService;

  constructor() {
    this.guildService = GuildService;
  }

  async execute(
    guildId: string,
    categoryId: string,
    textChannelId: string,
    voiceChannelId: string,
  ) {
    return await this.guildService.upsert(
      guildId,
      categoryId,
      textChannelId,
      voiceChannelId,
    );
  }
}

export default new GuildConfigurationUseCase();
