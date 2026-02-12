import GuildService from "../services/guild.service";

class GetGuildConfigurationUseCase {
  public guildService: typeof GuildService;

  constructor() {
    this.guildService = GuildService;
  }

  async execute(guildId: string) {
    return await this.guildService.getByGuildId(guildId);
  }
}

export default new GetGuildConfigurationUseCase();
