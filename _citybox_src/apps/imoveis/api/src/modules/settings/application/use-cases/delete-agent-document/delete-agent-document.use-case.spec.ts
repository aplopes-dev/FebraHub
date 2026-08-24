import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { AgentFolderDocumentNotFoundError } from '../../../domain/errors/agent-folder-document-not-found.error';
import { InMemoryAgentFolderDocumentRepository } from '../../../infrastructure/database/in-memory-agent-folder-document.repository';
import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { DeleteAgentDocumentUseCase } from './delete-agent-document.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

describe('DeleteAgentDocumentUseCase', () => {
  let documents: InMemoryAgentFolderDocumentRepository;
  let profiles: InMemoryAgentProfileRepository;
  let storage: InMemoryObjectStorage;
  let useCase: DeleteAgentDocumentUseCase;

  beforeEach(() => {
    documents = new InMemoryAgentFolderDocumentRepository();
    profiles = new InMemoryAgentProfileRepository();
    storage = new InMemoryObjectStorage();
    useCase = new DeleteAgentDocumentUseCase(documents, profiles, storage);
  });

  it('remove o documento e o arquivo do MinIO', async () => {
    await storage.put({
      key: 'doc-key',
      buffer: Buffer.from('x'),
      mimeType: 'application/pdf',
    });
    const document = await documents.create(STORE, AGENT, {
      folderId: 'client',
      name: 'contrato.pdf',
      status: 'pending',
      sizeLabel: '1 MB',
      detailsLabel: '',
      objectKey: 'doc-key',
      mimeType: 'application/pdf',
      source: 'manual',
      legalKind: null,
    });

    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      documentId: document.id,
    });

    expect(await documents.findAll(STORE, AGENT)).toHaveLength(0);
    expect(await storage.exists('doc-key')).toBe(false);
  });

  it('remove o documento legal do perfil ao apagar o espelho', async () => {
    await storage.put({
      key: 'legal-key',
      buffer: Buffer.from('x'),
      mimeType: 'application/pdf',
    });
    await profiles.ensure(STORE, AGENT);
    await profiles.upsertLegalDocument(STORE, AGENT, {
      kind: 'license',
      name: 'creci.pdf',
      sizeLabel: '2 MB',
      objectKey: 'legal-key',
      mimeType: 'application/pdf',
    });

    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      documentId: 'legal-license',
    });

    const profile = await profiles.findByAgentId(STORE, AGENT);
    expect(profile?.legalDocuments).toHaveLength(0);
    expect(await storage.exists('legal-key')).toBe(false);
  });

  it('rejeita documento inexistente', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        documentId: 'missing',
      }),
    ).rejects.toBeInstanceOf(AgentFolderDocumentNotFoundError);
  });

  it('rejeita espelho sem documento legal correspondente', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        documentId: 'legal-insurance',
      }),
    ).rejects.toBeInstanceOf(AgentFolderDocumentNotFoundError);
  });
});
