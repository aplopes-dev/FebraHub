import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { AgentLegalDocumentNotFoundError } from '../../../domain/errors/agent-legal-document-not-found.error';
import { AgentProfileNotFoundError } from '../../../domain/errors/agent-profile-not-found.error';
import { InvalidLegalDocumentKindError } from '../../../domain/errors/invalid-legal-document-kind.error';
import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { UpsertAgentLegalDocumentUseCase } from '../upsert-agent-legal-document/upsert-agent-legal-document.use-case';
import { DeleteAgentLegalDocumentUseCase } from './delete-agent-legal-document.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

const PDF_BUFFER = Buffer.concat([
  Buffer.from([0x25, 0x50, 0x44, 0x46]),
  Buffer.alloc(64),
]);

describe('DeleteAgentLegalDocumentUseCase', () => {
  let repo: InMemoryAgentProfileRepository;
  let storage: InMemoryObjectStorage;
  let useCase: DeleteAgentLegalDocumentUseCase;

  beforeEach(() => {
    repo = new InMemoryAgentProfileRepository();
    storage = new InMemoryObjectStorage();
    useCase = new DeleteAgentLegalDocumentUseCase(repo, storage);
  });

  it('remove a linha e o objeto do MinIO', async () => {
    const uploaded = await new UpsertAgentLegalDocumentUseCase(
      repo,
      storage,
    ).execute({
      storeId: STORE,
      agentId: AGENT,
      kind: 'license',
      buffer: PDF_BUFFER,
      filename: 'creci.pdf',
    });
    const objectKey = uploaded.legalDocuments[0].objectKey;

    const profile = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      kind: 'license',
    });

    expect(profile.legalDocuments).toEqual([]);
    expect(await storage.exists(objectKey)).toBe(false);
  });

  it('lança AgentProfileNotFoundError quando o perfil não existe', async () => {
    await expect(
      useCase.execute({ storeId: STORE, agentId: AGENT, kind: 'license' }),
    ).rejects.toBeInstanceOf(AgentProfileNotFoundError);
  });

  it('lança AgentLegalDocumentNotFoundError quando o tipo não foi enviado', async () => {
    await repo.ensure(STORE, AGENT);

    await expect(
      useCase.execute({ storeId: STORE, agentId: AGENT, kind: 'insurance' }),
    ).rejects.toBeInstanceOf(AgentLegalDocumentNotFoundError);
  });

  it('rejeita tipo de documento desconhecido', async () => {
    await expect(
      useCase.execute({ storeId: STORE, agentId: AGENT, kind: 'passport' }),
    ).rejects.toBeInstanceOf(InvalidLegalDocumentKindError);
  });
});
