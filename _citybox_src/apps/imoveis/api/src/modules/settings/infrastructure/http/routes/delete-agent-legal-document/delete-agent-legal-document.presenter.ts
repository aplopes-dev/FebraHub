import type { AgentProfileEntity } from '../../../../domain/entities/agent-profile.entity';
import { mapAgentProfileToHttp } from '../shared/agent-profile-response.mapper';

export class DeleteAgentLegalDocumentPresenter {
  static toHttp(profile: AgentProfileEntity) {
    return { data: mapAgentProfileToHttp(profile) };
  }
}
