import { UploadClinicLogoUseCase } from './upload-clinic-logo.use-case';
import { InMemoryClinicStoreProfileRepository } from '../../../tests/in-memory-clinic-store-profile.repository';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { ClinicStoreProfile } from '../../../domain/entities/clinic-store-profile.entity';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('UploadClinicLogoUseCase', () => {
  let uploadUseCase: UploadClinicLogoUseCase;
  let repository: InMemoryClinicStoreProfileRepository;
  let storage: InMemoryObjectStorage;

  beforeEach(() => {
    repository = new InMemoryClinicStoreProfileRepository();
    storage = new InMemoryObjectStorage();
    uploadUseCase = new UploadClinicLogoUseCase(repository, storage);
  });

  it('stores logo and updates profile metadata', async () => {
    const updated = await uploadUseCase.execute({
      storeId: STORE_ID,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    expect(updated).toBeInstanceOf(ClinicStoreProfile);
    expect(updated.hasLogo()).toBe(true);
    expect(updated.logoObjectKey).toBe(`${STORE_ID}/clinic-logo.png`);
    expect(await storage.exists(updated.logoObjectKey!)).toBe(true);
  });

  it('replaces existing logo on subsequent upload', async () => {
    await uploadUseCase.execute({
      storeId: STORE_ID,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    const updated = await uploadUseCase.execute({
      storeId: STORE_ID,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    expect(updated.logoObjectKey).toBe(`${STORE_ID}/clinic-logo.png`);
    expect(await storage.exists(`${STORE_ID}/clinic-logo.png`)).toBe(true);
  });
});
