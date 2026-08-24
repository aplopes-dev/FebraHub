import type { GetAgentPrivacyResult } from '../../../../application/use-cases/get-agent-privacy/get-agent-privacy.use-case';
import { mapAgentPrivacyToHttp } from '../shared/agent-privacy-response.mapper';

export class GetAgentPrivacyPresenter {
  static toHttp(privacy: GetAgentPrivacyResult) {
    return { data: mapAgentPrivacyToHttp(privacy) };
  }
}
