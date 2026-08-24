import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { AgentLegalDocumentNotFoundError } from '../../../domain/errors/agent-legal-document-not-found.error';
import { InvalidLegalDocumentKindError } from '../../../domain/errors/invalid-legal-document-kind.error';
import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { UpsertAgentLegalDocumentUseCase } from '../upsert-agent-legal-document/upsert-agent-legal-document.use-case';
import { GetAgentLegalDocumentUseCase } from './get-agent-legal-document.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

const PDF_BUFFER = Buffer.concat([
  Buffer.from([0x25, 0x50, 0x44, 0x46]),
  Buffer.alloc(64),
]);

describe('GetAgentLegalDocumentUseCase', () => {
  let repo: InMemoryAgentProfileRepository;
  let storage: InMemoryObjectStorage;
  let useCase: GetAgentLegalDocumentUseCase;

  beforeEach(() => {
    repo = new InMemoryAgentProfileRepository();
    storage = new InMemoryObjectStorage();
    useCase = new GetAgentLegalDocumentUseCase(repo, storage);
  });

  it('devolve bytes, mime type e nome do documento', async () => {
    await new UpsertAgentLegalDocumentUseCase(repo, storage).execute({
      storeId: STORE,
      agentId: AGENT,
      kind: 'employment',
      buffer: PDF_BUFFER,
      filename: 'contrato.pdf',
    });

    const result = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      kind: 'employment',
    });

    expect(result.name).toBe('contrato.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.buffer.equals(PDF_BUFFER)).toBe(true);
  });

  it('lança AgentLegalDocumentNotFoundError quando o tipo não foi enviado', async () => {
    await repo.ensure(STORE, AGENT);

    await expect(
      useCase.execute({ storeId: STORE, agentId: AGENT, kind: 'license' }),
    ).rejects.toBeInstanceOf(AgentLegalDocumentNotFoundError);
  });

  it('rejeita tipo de documento desconhecido', async () => {
    await expect(
      useCase.execute({ storeId: STORE, agentId: AGENT, kind: 'passport' }),
    ).rejects.toBeInstanceOf(InvalidLegalDocumentKindError);
  });
});
