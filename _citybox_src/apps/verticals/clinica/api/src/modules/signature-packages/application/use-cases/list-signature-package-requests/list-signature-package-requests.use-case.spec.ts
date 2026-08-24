import { ListSignaturePackageRequestsUseCase } from './list-signature-package-requests.use-case';
import { InMemorySignaturePackageRequestRepository } from '../../../tests/in-memory-signature-package-request.repository';
import { InMemorySignatureCreditBalanceRepository } from '../../../tests/in-memory-signature-credit-balance.repository';
import { SignaturePackageRequest } from '../../../domain/entities/signature-package-request.entity';

const STORE_A = '11111111-1111-4111-8111-111111111111';
const STORE_B = '22222222-2222-4222-8222-222222222222';

describe('ListSignaturePackageRequestsUseCase', () => {
  let useCase: ListSignaturePackageRequestsUseCase;
  let requestRepo: InMemorySignaturePackageRequestRepository;

  beforeEach(() => {
    const creditRepo = new InMemorySignatureCreditBalanceRepository();
    requestRepo = new InMemorySignaturePackageRequestRepository(creditRepo);
    useCase = new ListSignaturePackageRequestsUseCase(requestRepo);
  });

  it('should list requests for the store newest first with meta', async () => {
    const older = SignaturePackageRequest.create({
      storeId: STORE_A,
      packageId: 'pkg-250',
      quantity: 250,
      priceCents: 9990,
      createdAt: new Date('2026-08-01T10:00:00.000Z'),
    });
    const newer = SignaturePackageRequest.create({
      storeId: STORE_A,
      packageId: 'pkg-600',
      quantity: 600,
      priceCents: 19990,
      createdAt: new Date('2026-08-05T10:00:00.000Z'),
    });
    await requestRepo.save(older);
    await requestRepo.save(newer);
    await requestRepo.save(
      SignaturePackageRequest.create({
        storeId: STORE_B,
        packageId: 'pkg-250',
        quantity: 250,
        priceCents: 9990,
      }),
    );

    const result = await useCase.execute({ storeId: STORE_A });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe(newer.id);
    expect(result.items[1].id).toBe(older.id);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(10);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate requests', async () => {
    for (let i = 0; i < 3; i += 1) {
      await requestRepo.save(
        SignaturePackageRequest.create({
          storeId: STORE_A,
          packageId: 'pkg-250',
          quantity: 250,
          priceCents: 9990,
          createdAt: new Date(`2026-08-0${i + 1}T10:00:00.000Z`),
        }),
      );
    }

    const page1 = await useCase.execute({
      storeId: STORE_A,
      page: 1,
      perPage: 2,
    });
    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(3);
    expect(page1.totalPages).toBe(2);

    const page2 = await useCase.execute({
      storeId: STORE_A,
      page: 2,
      perPage: 2,
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.page).toBe(2);
  });

  it('should filter by status', async () => {
    const pending = SignaturePackageRequest.create({
      storeId: STORE_A,
      packageId: 'pkg-250',
      quantity: 250,
      priceCents: 9990,
    });
    const liberado = SignaturePackageRequest.create({
      storeId: STORE_A,
      packageId: 'pkg-600',
      quantity: 600,
      priceCents: 19990,
    }).withLiberated(new Date('2026-08-02T10:00:00.000Z'));
    await requestRepo.save(pending);
    await requestRepo.save(liberado);

    const result = await useCase.execute({
      storeId: STORE_A,
      status: 'pending',
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(pending.id);
    expect(result.total).toBe(1);
  });

  it('should return empty list when store has no requests', async () => {
    const result = await useCase.execute({ storeId: STORE_A });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
