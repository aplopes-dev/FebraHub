import { FindTechnicalSheetByProductIdUseCase } from './find-technical-sheet-by-product-id.use-case';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { TechnicalSheetNotEligibleError } from '../../../domain/errors/technical-sheet-not-eligible.error';
import { InMemoryTechnicalSheetRepository } from '../../../tests/in-memory-technical-sheet.repository';
import {
  makeCategory,
  makeProduct,
  makeRepositories,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('FindTechnicalSheetByProductIdUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedSupport();
    const sheetRepo = new InMemoryTechnicalSheetRepository();
    const product = makeProduct({}, 'prod-1');
    await repos.productRepository.save(product);
    sheetRepo.seedProduct(product, makeCategory());

    const useCase = new FindTechnicalSheetByProductIdUseCase(
      repos.productRepository,
      sheetRepo,
    );
    return { useCase, sheetRepo, repos };
  }

  it('retorna defaults quando ainda não há ficha', async () => {
    const { useCase } = await setup();
    const detail = await useCase.execute({
      organizationId: STORE_ID,
      productId: 'prod-1',
    });

    expect(detail.hasSheet).toBe(false);
    expect(detail.productionType).toBe('automatic');
    expect(detail.components).toEqual([]);
    expect(detail.currentPriceCents).toBe(5990);
  });

  it('rejeita produto inexistente', async () => {
    const { useCase } = await setup();
    await expect(
      useCase.execute({ organizationId: STORE_ID, productId: 'missing' }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('rejeita produto supply', async () => {
    const repos = makeRepositories();
    await repos.seedSupport();
    const sheetRepo = new InMemoryTechnicalSheetRepository();
    const supply = makeProduct({ type: 'supply', sku: 'INS-1' }, 'supply-1');
    await repos.productRepository.save(supply);
    sheetRepo.seedProduct(supply, makeCategory());

    const useCase = new FindTechnicalSheetByProductIdUseCase(
      repos.productRepository,
      sheetRepo,
    );

    await expect(
      useCase.execute({ organizationId: STORE_ID, productId: 'supply-1' }),
    ).rejects.toBeInstanceOf(TechnicalSheetNotEligibleError);
  });
});
