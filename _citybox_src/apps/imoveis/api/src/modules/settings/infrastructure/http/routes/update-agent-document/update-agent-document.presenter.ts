import type { AgentFolderDocumentEntity } from '../../../../domain/entities/agent-folder-document.entity';
import { mapAgentDocumentToHttp } from '../shared/agent-document-response.mapper';

export class UpdateAgentDocumentPresenter {
  static toHttp(document: AgentFolderDocumentEntity) {
    return { data: mapAgentDocumentToHttp(document) };
  }
}
