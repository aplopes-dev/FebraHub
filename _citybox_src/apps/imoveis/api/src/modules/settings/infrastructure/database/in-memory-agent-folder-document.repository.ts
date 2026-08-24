import {
  AgentFolderDocumentEntity,
  type DocumentFolderId,
} from '../../domain/entities/agent-folder-document.entity';
import {
  AgentFolderDocumentRepository,
  type AgentFolderDocumentCreatePayload,
  type AgentFolderDocumentUpdatePayload,
} from '../../domain/repositories/agent-folder-document.repository.interface';

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryAgentFolderDocumentRepository extends AgentFolderDocumentRepository {
  private readonly documents = new Map<string, AgentFolderDocumentEntity>();

  async findAll(
    storeId: string,
    agentId: string,
    folderId?: DocumentFolderId,
  ): Promise<AgentFolderDocumentEntity[]> {
    await Promise.resolve();
    return [...this.documents.values()].filter(
      (doc) =>
        doc.storeId === storeId &&
        doc.agentId === agentId &&
        (!folderId || doc.folderId === folderId),
    );
  }

  async findById(
    storeId: string,
    agentId: string,
    documentId: string,
  ): Promise<AgentFolderDocumentEntity | null> {
    const all = await this.findAll(storeId, agentId);
    return all.find((doc) => doc.id === documentId) ?? null;
  }

  async create(
    storeId: string,
    agentId: string,
    payload: AgentFolderDocumentCreatePayload,
  ): Promise<AgentFolderDocumentEntity> {
    await Promise.resolve();
    const entity = AgentFolderDocumentEntity.create({
      storeId,
      agentId,
      ...payload,
      addedAt: new Date(),
    });
    this.documents.set(entity.id, entity);
    return entity;
  }

  async update(
    storeId: string,
    agentId: string,
    documentId: string,
    payload: AgentFolderDocumentUpdatePayload,
  ): Promise<AgentFolderDocumentEntity | null> {
    const existing = await this.findById(storeId, agentId, documentId);
    if (!existing) return null;
    const provided = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );
    const entity = AgentFolderDocumentEntity.create(
      { ...existing.props, ...provided },
      existing.id,
    );
    this.documents.set(entity.id, entity);
    return entity;
  }

  async delete(
    storeId: string,
    agentId: string,
    documentId: string,
  ): Promise<boolean> {
    const existing = await this.findById(storeId, agentId, documentId);
    if (!existing) return false;
    return this.documents.delete(documentId);
  }

  async deleteAllForAgent(storeId: string, agentId: string): Promise<string[]> {
    const all = await this.findAll(storeId, agentId);
    const keys: string[] = [];
    for (const doc of all) {
      if (doc.objectKey) keys.push(doc.objectKey);
      this.documents.delete(doc.id);
    }
    return keys;
  }
}
