import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { AgentProfileNotFoundError } from '../../../domain/errors/agent-profile-not-found.error';
import { AgentProfilePhotoNotFoundError } from '../../../domain/errors/agent-profile-photo-not-found.error';
import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { UploadAgentProfilePhotoUseCase } from '../upload-agent-profile-photo/upload-agent-profile-photo.use-case';
import { DeleteAgentProfilePhotoUseCase } from './delete-agent-profile-photo.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('DeleteAgentProfilePhotoUseCase', () => {
  let repo: InMemoryAgentProfileRepository;
  let storage: InMemoryObjectStorage;
  let useCase: DeleteAgentProfilePhotoUseCase;

  beforeEach(() => {
    repo = new InMemoryAgentProfileRepository();
    storage = new InMemoryObjectStorage();
    useCase = new DeleteAgentProfilePhotoUseCase(repo, storage);
  });

  it('remove a referência e o objeto do MinIO', async () => {
    const uploaded = await new UploadAgentProfilePhotoUseCase(
      repo,
      storage,
    ).execute({
      storeId: STORE,
      agentId: AGENT,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });
    const objectKey = uploaded.photo!.objectKey;

    const profile = await useCase.execute({ storeId: STORE, agentId: AGENT });

    expect(profile.photo).toBeNull();
    expect(await storage.exists(objectKey)).toBe(false);
  });

  it('lança AgentProfileNotFoundError quando o perfil não existe', async () => {
    await expect(
      useCase.execute({ storeId: STORE, agentId: AGENT }),
    ).rejects.toBeInstanceOf(AgentProfileNotFoundError);
  });

  it('lança AgentProfilePhotoNotFoundError quando não há foto', async () => {
    await repo.ensure(STORE, AGENT);

    await expect(
      useCase.execute({ storeId: STORE, agentId: AGENT }),
    ).rejects.toBeInstanceOf(AgentProfilePhotoNotFoundError);
  });
});
