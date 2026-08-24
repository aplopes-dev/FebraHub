import { GetClinicLogoUseCase } from './get-clinic-logo.use-case';
import { UploadClinicLogoUseCase } from '../upload-clinic-logo/upload-clinic-logo.use-case';
import { InMemoryClinicStoreProfileRepository } from '../../../tests/in-memory-clinic-store-profile.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { ClinicProfileHasNoLogoError } from '../../../domain/errors/clinic-profile.errors';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('GetClinicLogoUseCase', () => {
  let getUseCase: GetClinicLogoUseCase;
  let uploadUseCase: UploadClinicLogoUseCase;
  let repository: InMemoryClinicStoreProfileRepository;
  let storage: InMemoryObjectStorage;

  beforeEach(() => {
    repository = new InMemoryClinicStoreProfileRepository();
    storage = new InMemoryObjectStorage();
    getUseCase = new GetClinicLogoUseCase(repository, storage);
    uploadUseCase = new UploadClinicLogoUseCase(repository, storage);
  });

  it('returns stored logo buffer and mime type', async () => {
    await uploadUseCase.execute({
      storeId: STORE_ID,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    const result = await getUseCase.execute({ storeId: STORE_ID });

    expect(result.mimeType).toBe('image/png');
    expect(result.buffer.subarray(0, 8)).toEqual(PNG_BUFFER.subarray(0, 8));
  });

  it('throws when profile has no logo', async () => {
    await expect(
      getUseCase.execute({ storeId: STORE_ID }),
    ).rejects.toBeInstanceOf(ClinicProfileHasNoLogoError);
  });
});
