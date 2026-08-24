import type { AgentFolderDocumentEntity } from '../../../../domain/entities/agent-folder-document.entity';
import { mapAgentDocumentToHttp } from '../shared/agent-document-response.mapper';

export class ListAgentDocumentsPresenter {
  static toHttp(documents: readonly AgentFolderDocumentEntity[]) {
    return { data: documents.map(mapAgentDocumentToHttp) };
  }
}
