import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { AgentProfilePhotoNotFoundError } from '../../../domain/errors/agent-profile-photo-not-found.error';
import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { UploadAgentProfilePhotoUseCase } from '../upload-agent-profile-photo/upload-agent-profile-photo.use-case';
import { GetAgentProfilePhotoUseCase } from './get-agent-profile-photo.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('GetAgentProfilePhotoUseCase', () => {
  let repo: InMemoryAgentProfileRepository;
  let storage: InMemoryObjectStorage;
  let useCase: GetAgentProfilePhotoUseCase;

  beforeEach(() => {
    repo = new InMemoryAgentProfileRepository();
    storage = new InMemoryObjectStorage();
    useCase = new GetAgentProfilePhotoUseCase(repo, storage);
  });

  it('devolve os bytes e o mime type da foto salva', async () => {
    await new UploadAgentProfilePhotoUseCase(repo, storage).execute({
      storeId: STORE,
      agentId: AGENT,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    const result = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(result.mimeType).toBe('image/png');
    expect(result.buffer.equals(PNG_BUFFER)).toBe(true);
  });

  it('lança AgentProfilePhotoNotFoundError quando o perfil não existe', async () => {
    await expect(
      useCase.execute({ storeId: STORE, agentId: AGENT }),
    ).rejects.toBeInstanceOf(AgentProfilePhotoNotFoundError);
  });

  it('lança AgentProfilePhotoNotFoundError quando o perfil não tem foto', async () => {
    await repo.ensure(STORE, AGENT);

    await expect(
      useCase.execute({ storeId: STORE, agentId: AGENT }),
    ).rejects.toBeInstanceOf(AgentProfilePhotoNotFoundError);
  });
});
