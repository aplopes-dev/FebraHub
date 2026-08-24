import { CancelSignaturePackageRequestUseCase } from './cancel-signature-package-request.use-case';
import { SignaturePackageRequest } from '../../../domain/entities/signature-package-request.entity';
import { SignaturePackageRequestNotPendingError } from '../../../domain/errors/signature-package-request-not-pending.error';
import { InMemorySignatureCreditBalanceRepository } from '../../../tests/in-memory-signature-credit-balance.repository';
import { InMemorySignaturePackageRequestRepository } from '../../../tests/in-memory-signature-package-request.repository';

describe('CancelSignaturePackageRequestUseCase', () => {
  const STORE_ID = 'store-cancel-1';
  let requestRepo: InMemorySignaturePackageRequestRepository;
  let useCase: CancelSignaturePackageRequestUseCase;

  beforeEach(() => {
    const creditRepo = new InMemorySignatureCreditBalanceRepository();
    requestRepo = new InMemorySignaturePackageRequestRepository(creditRepo);
    useCase = new CancelSignaturePackageRequestUseCase(requestRepo);
  });

  it('cancels a pending request', async () => {
    const pending = await requestRepo.save(
      SignaturePackageRequest.create({
        storeId: STORE_ID,
        packageId: 'pkg-250',
        quantity: 250,
        priceCents: 9990,
      }),
    );

    const result = await useCase.execute({ storeId: STORE_ID, id: pending.id });

    expect(result.status).toBe('cancelado');
  });

  it('is idempotent when already cancelado', async () => {
    const cancelled = await requestRepo.save(
      SignaturePackageRequest.create({
        storeId: STORE_ID,
        packageId: 'pkg-250',
        quantity: 250,
        priceCents: 9990,
        status: 'cancelado',
      }),
    );

    const result = await useCase.execute({
      storeId: STORE_ID,
      id: cancelled.id,
    });

    expect(result.status).toBe('cancelado');
  });

  it('rejects when already liberado', async () => {
    const liberated = await requestRepo.save(
      SignaturePackageRequest.create({
        storeId: STORE_ID,
        packageId: 'pkg-250',
        quantity: 250,
        priceCents: 9990,
        status: 'liberado',
        liberatedAt: new Date(),
      }),
    );

    await expect(
      useCase.execute({ storeId: STORE_ID, id: liberated.id }),
    ).rejects.toBeInstanceOf(SignaturePackageRequestNotPendingError);
  });
});
