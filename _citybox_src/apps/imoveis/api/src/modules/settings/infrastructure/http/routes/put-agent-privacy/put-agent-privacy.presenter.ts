import type { AgentProfileEntity } from '../../../../domain/entities/agent-profile.entity';

export class PutAgentPrivacyPresenter {
  static toHttp(profile: AgentProfileEntity) {
    return { data: { twoFactorEnabled: profile.twoFactorEnabled } };
  }
}
