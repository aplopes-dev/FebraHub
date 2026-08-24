import { LiberateSignaturePackageRequestUseCase } from './liberate-signature-package-request.use-case';
import { InMemorySignaturePackageRequestRepository } from '../../../tests/in-memory-signature-package-request.repository';
import { InMemorySignatureCreditBalanceRepository } from '../../../tests/in-memory-signature-credit-balance.repository';
import { SignaturePackageRequest } from '../../../domain/entities/signature-package-request.entity';
import { SignatureCreditBalance } from '../../../domain/entities/signature-credit-balance.entity';
import { SignaturePackageRequestNotFoundError } from '../../../domain/errors/signature-package-request-not-found.error';
import { SIGNATURE_CREDIT_SEED_BALANCE } from '../../../domain/signature-package-catalog';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('LiberateSignaturePackageRequestUseCase', () => {
  let useCase: LiberateSignaturePackageRequestUseCase;
  let requestRepo: InMemorySignaturePackageRequestRepository;
  let creditRepo: InMemorySignatureCreditBalanceRepository;

  beforeEach(() => {
    creditRepo = new InMemorySignatureCreditBalanceRepository();
    requestRepo = new InMemorySignaturePackageRequestRepository(creditRepo);
    useCase = new LiberateSignaturePackageRequestUseCase(
      requestRepo,
      creditRepo,
    );
  });

  it('should liberate pending request and add quantity to balance', async () => {
    await creditRepo.save(
      SignatureCreditBalance.create({
        storeId: STORE_ID,
        balance: SIGNATURE_CREDIT_SEED_BALANCE,
      }),
    );
    const pending = await requestRepo.save(
      SignaturePackageRequest.create({
        storeId: STORE_ID,
        packageId: 'pkg-250',
        quantity: 250,
        priceCents: 9990,
      }),
    );

    const liberated = await useCase.execute({
      storeId: STORE_ID,
      id: pending.id,
    });

    expect(liberated.status).toBe('liberado');
    expect(liberated.liberatedAt).not.toBeNull();

    const balance = await creditRepo.findByStoreId(STORE_ID);
    expect(balance?.balance).toBe(SIGNATURE_CREDIT_SEED_BALANCE + 250);
  });

  it('should be idempotent when already liberado', async () => {
    await creditRepo.save(
      SignatureCreditBalance.create({ storeId: STORE_ID, balance: 0 }),
    );
    const pending = await requestRepo.save(
      SignaturePackageRequest.create({
        storeId: STORE_ID,
        packageId: 'pkg-250',
        quantity: 250,
        priceCents: 9990,
      }),
    );
    const first = await useCase.execute({ storeId: STORE_ID, id: pending.id });
    const second = await useCase.execute({
      storeId: STORE_ID,
      id: pending.id,
    });

    expect(second.id).toBe(first.id);
    expect(second.status).toBe('liberado');
    const balance = await creditRepo.findByStoreId(STORE_ID);
    expect(balance?.balance).toBe(0 + 250);
  });

  it('should seed balance when liberating without prior credits row', async () => {
    const pending = await requestRepo.save(
      SignaturePackageRequest.create({
        storeId: STORE_ID,
        packageId: 'pkg-600',
        quantity: 600,
        priceCents: 19990,
      }),
    );

    await useCase.execute({ storeId: STORE_ID, id: pending.id });

    const balance = await creditRepo.findByStoreId(STORE_ID);
    expect(balance?.balance).toBe(SIGNATURE_CREDIT_SEED_BALANCE + 600);
  });

  it('should throw NotFound when request does not exist', async () => {
    await expect(
      useCase.execute({
        storeId: STORE_ID,
        id: '00000000-0000-4000-8000-000000000000',
      }),
    ).rejects.toBeInstanceOf(SignaturePackageRequestNotFoundError);
  });
});
