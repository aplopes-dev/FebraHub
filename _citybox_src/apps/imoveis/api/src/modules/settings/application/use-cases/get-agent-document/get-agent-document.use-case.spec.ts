import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { AgentFolderDocumentNotFoundError } from '../../../domain/errors/agent-folder-document-not-found.error';
import { DocumentFileUnavailableError } from '../../../domain/errors/document-file-unavailable.error';
import { InMemoryAgentFolderDocumentRepository } from '../../../infrastructure/database/in-memory-agent-folder-document.repository';
import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { GetAgentDocumentUseCase } from './get-agent-document.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

describe('GetAgentDocumentUseCase', () => {
  let documents: InMemoryAgentFolderDocumentRepository;
  let profiles: InMemoryAgentProfileRepository;
  let storage: InMemoryObjectStorage;
  let useCase: GetAgentDocumentUseCase;

  beforeEach(() => {
    documents = new InMemoryAgentFolderDocumentRepository();
    profiles = new InMemoryAgentProfileRepository();
    storage = new InMemoryObjectStorage();
    useCase = new GetAgentDocumentUseCase(documents, profiles, storage);
  });

  it('devolve o binário do documento da pasta', async () => {
    await storage.put({
      key: 'doc-key',
      buffer: Buffer.from('conteudo'),
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

    const result = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      documentId: document.id,
    });

    expect(result.name).toBe('contrato.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.buffer.toString()).toBe('conteudo');
  });

  it('devolve o binário de um documento legal espelhado', async () => {
    await storage.put({
      key: 'legal-key',
      buffer: Buffer.from('creci'),
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

    const result = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      documentId: 'legal-license',
    });

    expect(result.name).toBe('creci.pdf');
    expect(result.buffer.toString()).toBe('creci');
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

  it('rejeita espelho legal sem documento no perfil', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        documentId: 'legal-license',
      }),
    ).rejects.toBeInstanceOf(AgentFolderDocumentNotFoundError);
  });

  it('rejeita documento sem arquivo associado', async () => {
    const document = await documents.create(STORE, AGENT, {
      folderId: 'client',
      name: 'pendente.pdf',
      status: 'pending',
      sizeLabel: '—',
      detailsLabel: '',
      objectKey: null,
      mimeType: null,
      source: 'manual',
      legalKind: null,
    });

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        documentId: document.id,
      }),
    ).rejects.toBeInstanceOf(DocumentFileUnavailableError);
  });
});
