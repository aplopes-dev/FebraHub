import { DeleteClinicLogoUseCase } from './delete-clinic-logo.use-case';
import { UploadClinicLogoUseCase } from '../upload-clinic-logo/upload-clinic-logo.use-case';
import { InMemoryClinicStoreProfileRepository } from '../../../tests/in-memory-clinic-store-profile.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { ClinicProfileHasNoLogoError } from '../../../domain/errors/clinic-profile.errors';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('DeleteClinicLogoUseCase', () => {
  let deleteUseCase: DeleteClinicLogoUseCase;
  let uploadUseCase: UploadClinicLogoUseCase;
  let repository: InMemoryClinicStoreProfileRepository;
  let storage: InMemoryObjectStorage;

  beforeEach(() => {
    repository = new InMemoryClinicStoreProfileRepository();
    storage = new InMemoryObjectStorage();
    deleteUseCase = new DeleteClinicLogoUseCase(repository, storage);
    uploadUseCase = new UploadClinicLogoUseCase(repository, storage);
  });

  it('removes logo from storage and clears profile metadata', async () => {
    const uploaded = await uploadUseCase.execute({
      storeId: STORE_ID,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    const updated = await deleteUseCase.execute({ storeId: STORE_ID });

    expect(updated.hasLogo()).toBe(false);
    expect(updated.logoObjectKey).toBeNull();
    expect(await storage.exists(uploaded.logoObjectKey!)).toBe(false);
  });

  it('throws when profile has no logo', async () => {
    await expect(
      deleteUseCase.execute({ storeId: STORE_ID }),
    ).rejects.toBeInstanceOf(ClinicProfileHasNoLogoError);
  });
});
