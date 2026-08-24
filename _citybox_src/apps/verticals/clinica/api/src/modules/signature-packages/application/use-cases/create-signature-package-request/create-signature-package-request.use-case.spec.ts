import { CreateSignaturePackageRequestUseCase } from './create-signature-package-request.use-case';
import { InMemorySignaturePackageRequestRepository } from '../../../tests/in-memory-signature-package-request.repository';
import { InMemorySignatureCreditBalanceRepository } from '../../../tests/in-memory-signature-credit-balance.repository';
import { SignaturePackageRequest } from '../../../domain/entities/signature-package-request.entity';
import { InvalidSignaturePackageError } from '../../../domain/errors/invalid-signature-package.error';

const STORE_ID = '11111111-1111-4111-8111-111111111111';

describe('CreateSignaturePackageRequestUseCase', () => {
  let useCase: CreateSignaturePackageRequestUseCase;
  let requestRepo: InMemorySignaturePackageRequestRepository;

  beforeEach(() => {
    const creditRepo = new InMemorySignatureCreditBalanceRepository();
    requestRepo = new InMemorySignaturePackageRequestRepository(creditRepo);
    useCase = new CreateSignaturePackageRequestUseCase(requestRepo);
  });

  it('should create a pending request from catalog', async () => {
    const request = await useCase.execute({
      storeId: STORE_ID,
      packageId: 'pkg-250',
    });

    expect(request).toBeInstanceOf(SignaturePackageRequest);
    expect(request.storeId).toBe(STORE_ID);
    expect(request.packageId).toBe('pkg-250');
    expect(request.quantity).toBe(250);
    expect(request.priceCents).toBe(9990);
    expect(request.status).toBe('pending');
    expect(request.liberatedAt).toBeNull();
  });

  it('should resolve pkg-600 and pkg-1000 from catalog', async () => {
    const pkg600 = await useCase.execute({
      storeId: STORE_ID,
      packageId: 'pkg-600',
    });
    const pkg1000 = await useCase.execute({
      storeId: STORE_ID,
      packageId: 'pkg-1000',
    });

    expect(pkg600.quantity).toBe(600);
    expect(pkg600.priceCents).toBe(19990);
    expect(pkg1000.quantity).toBe(1000);
    expect(pkg1000.priceCents).toBe(29990);
  });

  it('should throw when packageId is invalid', async () => {
    await expect(
      useCase.execute({ storeId: STORE_ID, packageId: 'pkg-unknown' }),
    ).rejects.toBeInstanceOf(InvalidSignaturePackageError);
  });
});
