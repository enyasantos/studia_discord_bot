import GuildRepository from "../repositories/guild.repository.js";

class GetGuildConfigurationUseCase {
  public guildRepository: typeof GuildRepository;

  constructor() {
    this.guildRepository = GuildRepository;
  }

  async execute(guildId: string) {
    return await this.guildRepository.getByGuildId(guildId);
  }
}

export default new GetGuildConfigurationUseCase();
