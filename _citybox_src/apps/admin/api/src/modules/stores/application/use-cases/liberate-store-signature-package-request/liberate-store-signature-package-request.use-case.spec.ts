import { LiberateStoreSignaturePackageRequestUseCase } from './liberate-store-signature-package-request.use-case';
import { InMemoryStoreRepository } from '../../../tests/in-memory-store.repository';
import {
  FakeSignaturePackageProvisioning,
  buildSignaturePackageRequest,
} from '../../../tests/fake-signature-package-provisioning';
import { Store } from '../../../domain/entities/store.entity';
import { StoreNotFoundError } from '../../../domain/errors/store-not-found.error';
import { StoreVerticalNotSupportedError } from '../../../domain/errors/store-vertical-not-supported.error';

const MISSING_STORE_ID = '00000000-0000-4000-8000-000000000001';

async function seedClinicStore(repo: InMemoryStoreRepository): Promise<Store> {
  return repo.save(
    Store.create({
      vertical: 'Clínica',
      tradeName: 'Clínica Vida',
      slug: 'clinica-vida-lib',
      timezone: 'America/Bahia',
      personType: 'PJ',
      responsibleName: 'Ana Nascimento',
      billingEmail: 'ana@clinica.test',
    }),
  );
}

async function seedComercioStore(
  repo: InMemoryStoreRepository,
): Promise<Store> {
  return repo.save(
    Store.create({
      vertical: 'Comércio',
      tradeName: 'Mercado Central',
      slug: 'mercado-central-lib',
      timezone: 'America/Bahia',
      personType: 'PJ',
      responsibleName: 'João Silva',
      billingEmail: 'joao@comercio.test',
    }),
  );
}

describe('LiberateStoreSignaturePackageRequestUseCase', () => {
  it('liberates a pending request for a Clínica store', async () => {
    const storeRepo = new InMemoryStoreRepository();
    const store = await seedClinicStore(storeRepo);
    const request = buildSignaturePackageRequest({
      id: 'req-42',
      storeId: store.id,
      status: 'pending',
    });
    const provisioning = new FakeSignaturePackageProvisioning({
      requests: [request],
    });
    const useCase = new LiberateStoreSignaturePackageRequestUseCase(
      storeRepo,
      provisioning,
    );

    const result = await useCase.execute({
      storeId: store.id,
      requestId: 'req-42',
    });

    expect(provisioning.liberateCalls).toEqual([
      { storeId: store.id, requestId: 'req-42' },
    ]);
    expect(result.status).toBe('liberado');
    expect(result.liberatedAt).not.toBeNull();
    expect(result.id).toBe('req-42');
  });

  it('rejects unknown store before talking to the vertical', async () => {
    const storeRepo = new InMemoryStoreRepository();
    const provisioning = new FakeSignaturePackageProvisioning();
    const useCase = new LiberateStoreSignaturePackageRequestUseCase(
      storeRepo,
      provisioning,
    );

    await expect(
      useCase.execute({ storeId: MISSING_STORE_ID, requestId: 'req-1' }),
    ).rejects.toBeInstanceOf(StoreNotFoundError);
    expect(provisioning.liberateCalls).toHaveLength(0);
  });

  it('rejects non-Clínica vertical before talking to the vertical', async () => {
    const storeRepo = new InMemoryStoreRepository();
    const store = await seedComercioStore(storeRepo);
    const provisioning = new FakeSignaturePackageProvisioning();
    const useCase = new LiberateStoreSignaturePackageRequestUseCase(
      storeRepo,
      provisioning,
    );

    await expect(
      useCase.execute({ storeId: store.id, requestId: 'req-1' }),
    ).rejects.toBeInstanceOf(StoreVerticalNotSupportedError);
    expect(provisioning.liberateCalls).toHaveLength(0);
  });
});
