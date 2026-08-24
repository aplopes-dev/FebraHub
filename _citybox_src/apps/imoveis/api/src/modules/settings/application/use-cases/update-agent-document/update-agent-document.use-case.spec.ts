import { AgentFolderDocumentNotFoundError } from '../../../domain/errors/agent-folder-document-not-found.error';
import { InvalidDocumentStatusError } from '../../../domain/errors/invalid-document-status.error';
import { InMemoryAgentFolderDocumentRepository } from '../../../infrastructure/database/in-memory-agent-folder-document.repository';
import { UpdateAgentDocumentUseCase } from './update-agent-document.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

describe('UpdateAgentDocumentUseCase', () => {
  let documents: InMemoryAgentFolderDocumentRepository;
  let useCase: UpdateAgentDocumentUseCase;

  beforeEach(() => {
    documents = new InMemoryAgentFolderDocumentRepository();
    useCase = new UpdateAgentDocumentUseCase(documents);
  });

  async function createDocument() {
    return documents.create(STORE, AGENT, {
      folderId: 'client',
      name: 'contrato.pdf',
      status: 'pending',
      sizeLabel: '1 MB',
      detailsLabel: 'Contrato',
      objectKey: 'key',
      mimeType: 'application/pdf',
      source: 'manual',
      legalKind: null,
    });
  }

  it('atualiza status e descrição', async () => {
    const document = await createDocument();

    const updated = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      documentId: document.id,
      status: 'completed',
      detailsLabel: '  Assinado  ',
    });

    expect(updated.status).toBe('completed');
    expect(updated.detailsLabel).toBe('Assinado');
  });

  it('mantém os campos não informados', async () => {
    const document = await createDocument();

    const updated = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      documentId: document.id,
      status: 'archived',
    });

    expect(updated.status).toBe('archived');
    expect(updated.detailsLabel).toBe('Contrato');
  });

  it('rejeita status desconhecido', async () => {
    const document = await createDocument();

    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        documentId: document.id,
        status: 'draft',
      }),
    ).rejects.toBeInstanceOf(InvalidDocumentStatusError);
  });

  it('rejeita edição de espelho de documento legal', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        documentId: 'legal-license',
        status: 'completed',
      }),
    ).rejects.toBeInstanceOf(AgentFolderDocumentNotFoundError);
  });

  it('rejeita documento inexistente', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        documentId: 'missing',
        status: 'completed',
      }),
    ).rejects.toBeInstanceOf(AgentFolderDocumentNotFoundError);
  });
});
