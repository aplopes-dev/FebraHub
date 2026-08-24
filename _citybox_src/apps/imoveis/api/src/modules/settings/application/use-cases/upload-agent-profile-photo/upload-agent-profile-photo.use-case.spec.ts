import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { InvalidImageFileError } from '../../../../properties/domain/errors/invalid-image-file.error';
import { InMemoryAgentProfileRepository } from '../../../infrastructure/database/in-memory-agent-profile.repository';
import { UploadAgentProfilePhotoUseCase } from './upload-agent-profile-photo.use-case';

const STORE = 'store-1';
const AGENT = 'ana-helena';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);
const JPEG_BUFFER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);

describe('UploadAgentProfilePhotoUseCase', () => {
  let repo: InMemoryAgentProfileRepository;
  let storage: InMemoryObjectStorage;
  let useCase: UploadAgentProfilePhotoUseCase;

  beforeEach(() => {
    repo = new InMemoryAgentProfileRepository();
    storage = new InMemoryObjectStorage();
    useCase = new UploadAgentProfilePhotoUseCase(repo, storage);
  });

  it('armazena a foto no MinIO e persiste os metadados', async () => {
    const profile = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    expect(profile.photo).toEqual({
      objectKey: `${STORE}/settings/profiles/${AGENT}/photo.png`,
      mimeType: 'image/png',
    });
    expect(await storage.exists(profile.photo!.objectKey)).toBe(true);
  });

  it('cria o perfil quando o corretor ainda não tinha um', async () => {
    await expect(repo.findByAgentId(STORE, AGENT)).resolves.toBeNull();

    await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    await expect(repo.findByAgentId(STORE, AGENT)).resolves.not.toBeNull();
  });

  it('remove o objeto anterior ao trocar a extensão da foto', async () => {
    const first = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });
    const previousKey = first.photo!.objectKey;

    const second = await useCase.execute({
      storeId: STORE,
      agentId: AGENT,
      buffer: JPEG_BUFFER,
      declaredMimeType: 'image/jpeg',
    });

    expect(second.photo!.objectKey).toBe(
      `${STORE}/settings/profiles/${AGENT}/photo.jpg`,
    );
    expect(await storage.exists(previousKey)).toBe(false);
    expect(await storage.exists(second.photo!.objectKey)).toBe(true);
  });

  it('rejeita arquivo cujo conteúdo não é imagem suportada', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        agentId: AGENT,
        buffer: Buffer.from('não é imagem'),
        declaredMimeType: 'image/png',
      }),
    ).rejects.toBeInstanceOf(InvalidImageFileError);
  });
});
