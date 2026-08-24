import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DEFAULT_SYSTEM_SETTINGS } from '../../../../settings/domain/entities/store-settings.entity';
import { AgentProfileRepository } from '../../../../settings/domain/repositories/agent-profile.repository.interface';
import { StoreSettingsRepository } from '../../../../settings/domain/repositories/store-settings.repository.interface';
import { TeamMemberRepository } from '../../../../settings/domain/repositories/team-member.repository.interface';
import {
  mergePublicAgentView,
  type PublicAgentView,
} from '../../policies/merge-public-agent';
import { resolveActivePublicAgent } from '../../policies/resolve-active-public-agent';

export type GetPublicAgentInput = {
  storeId: string;
  slug: string;
};

@Injectable()
export class GetPublicAgentUseCase implements IUseCase<
  GetPublicAgentInput,
  PublicAgentView
> {
  constructor(
    private readonly members: TeamMemberRepository,
    private readonly profiles: AgentProfileRepository,
    private readonly storeSettings: StoreSettingsRepository,
  ) {}

  async execute(input: GetPublicAgentInput): Promise<PublicAgentView> {
    const member = await resolveActivePublicAgent(
      this.members,
      input.storeId,
      input.slug,
      GetPublicAgentUseCase.name,
    );
    const [profile, settings] = await Promise.all([
      this.profiles.findByAgentId(input.storeId, member.agentId),
      this.storeSettings.findByStoreId(input.storeId),
    ]);
    return mergePublicAgentView(member, profile, {
      whatsappCatalogEnabled:
        settings?.system.whatsappCatalogEnabled ??
        DEFAULT_SYSTEM_SETTINGS.whatsappCatalogEnabled,
      leadFormCatalogEnabled:
        settings?.system.leadFormCatalogEnabled ??
        DEFAULT_SYSTEM_SETTINGS.leadFormCatalogEnabled,
      accentColorId:
        settings?.system.accentColorId ?? DEFAULT_SYSTEM_SETTINGS.accentColorId,
    });
  }
}
