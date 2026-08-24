import { UpsertTechnicalSheetUseCase } from './upsert-technical-sheet.use-case';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { TechnicalSheetInvalidValuesError } from '../../../domain/errors/technical-sheet-invalid-values.error';
import { TechnicalSheetNotEligibleError } from '../../../domain/errors/technical-sheet-not-eligible.error';
import { InMemoryTechnicalSheetRepository } from '../../../tests/in-memory-technical-sheet.repository';
import {
  makeCategory,
  makeProduct,
  makeRepositories,
  STORE_ID,
  VARIATION_ID,
  VARIATION_OPTION_ID,
} from '../../../tests/catalog-test-factory';
import { Product } from '../../../domain/entities/product.entity';

describe('UpsertTechnicalSheetUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedSupport();
    const sheetRepo = new InMemoryTechnicalSheetRepository();

    const finished = Product.create(
      {
        organizationId: STORE_ID,
        name: 'Pizza',
        sku: 'PZ-1',
        categoryId: makeCategory().id,
        unitOfMeasureId: null,
        type: 'simple',
        basePriceCents: 4500,
        variations: [
          {
            variationId: VARIATION_ID,
            optionIds: [VARIATION_OPTION_ID],
            minChoices: 1,
            maxChoices: 1,
            optionOverrides: [],
            sortOrder: 0,
          },
        ],
      },
      'prod-1',
    );
    const supply = makeProduct(
      {
        name: 'Mussarela',
        sku: 'INS-QUE',
        type: 'supply',
        basePriceCents: 4200,
      },
      'supply-1',
    );
    const otherSupply = makeProduct(
      { name: 'Farinha', sku: 'INS-FAR', type: 'supply', basePriceCents: 1250 },
      'supply-2',
    );
    const simpleOther = makeProduct(
      { name: 'Camiseta', sku: 'CAM-2', type: 'simple' },
      'prod-2',
    );

    for (const product of [finished, supply, otherSupply, simpleOther]) {
      await repos.productRepository.save(product);
      sheetRepo.seedProduct(product, makeCategory());
    }
    sheetRepo.seedSupplyMeta('supply-1', {
      name: 'Mussarela',
      unit: 'kg',
      unitCostCents: 4200,
      type: 'supply',
      deletedAt: null,
    });
    sheetRepo.seedSupplyMeta('supply-2', {
      name: 'Farinha',
      unit: 'kg',
      unitCostCents: 1250,
      type: 'supply',
      deletedAt: null,
    });

    const useCase = new UpsertTechnicalSheetUseCase(
      repos.productRepository,
      sheetRepo,
    );

    return { useCase, sheetRepo, repos };
  }

  it('cria ficha com componentes supply e aplica preço', async () => {
    const { useCase, repos } = await setup();

    const result = await useCase.execute({
      organizationId: STORE_ID,
      productId: 'prod-1',
      productionType: 'automatic',
      maxRemovableComponents: 1,
      markupPercent: 100,
      components: [
        {
          componentProductId: 'supply-1',
          optional: false,
          quantity: 0.2,
          sortOrder: 0,
        },
        {
          componentProductId: 'supply-2',
          optional: true,
          quantity: 0.3,
          sortOrder: 1,
        },
      ],
      optionComponents: [
        {
          variationOptionId: VARIATION_OPTION_ID,
          componentProductId: 'supply-1',
          optional: false,
          quantity: 0.05,
          sortOrder: 0,
        },
      ],
      applyBasePriceCents: 5200,
    });

    expect(result.sheet.components).toHaveLength(2);
    expect(result.sheet.optionComponents).toHaveLength(1);
    expect(result.detail.hasSheet).toBe(true);
    expect(result.detail.totalCostCents).toBe(
      Math.round(0.2 * 4200) + Math.round(0.3 * 1250),
    );

    const updated = await repos.productRepository.findById(STORE_ID, 'prod-1');
    expect(updated?.basePriceCents).toBe(5200);
  });

  it('substitui o conjunto de linhas no upsert', async () => {
    const { useCase, sheetRepo } = await setup();

    await useCase.execute({
      organizationId: STORE_ID,
      productId: 'prod-1',
      productionType: 'automatic',
      maxRemovableComponents: 0,
      markupPercent: 0,
      components: [
        {
          componentProductId: 'supply-1',
          optional: false,
          quantity: 1,
          sortOrder: 0,
        },
      ],
      optionComponents: [],
    });

    await useCase.execute({
      organizationId: STORE_ID,
      productId: 'prod-1',
      productionType: 'productive_process',
      maxRemovableComponents: 0,
      markupPercent: 30,
      components: [
        {
          componentProductId: 'supply-2',
          optional: false,
          quantity: 2,
          sortOrder: 0,
        },
      ],
      optionComponents: [],
    });

    const sheet = await sheetRepo.findByProductId(STORE_ID, 'prod-1');
    expect(sheet?.productionType).toBe('productive_process');
    expect(sheet?.components).toHaveLength(1);
    expect(sheet?.components[0]?.componentProductId).toBe('supply-2');
  });

  it('rejeita componente que não é supply', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        productId: 'prod-1',
        productionType: 'automatic',
        maxRemovableComponents: 0,
        markupPercent: 0,
        components: [
          {
            componentProductId: 'prod-2',
            optional: false,
            quantity: 1,
            sortOrder: 0,
          },
        ],
        optionComponents: [],
      }),
    ).rejects.toBeInstanceOf(TechnicalSheetInvalidValuesError);
  });

  it('rejeita option components em processo produtivo', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        productId: 'prod-1',
        productionType: 'productive_process',
        maxRemovableComponents: 0,
        markupPercent: 0,
        components: [],
        optionComponents: [
          {
            variationOptionId: VARIATION_OPTION_ID,
            componentProductId: 'supply-1',
            optional: false,
            quantity: 1,
            sortOrder: 0,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(TechnicalSheetInvalidValuesError);
  });

  it('rejeita opção não vinculada ao produto', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        productId: 'prod-1',
        productionType: 'automatic',
        maxRemovableComponents: 0,
        markupPercent: 0,
        components: [],
        optionComponents: [
          {
            variationOptionId: '00000000-0000-4000-8000-000000000099',
            componentProductId: 'supply-1',
            optional: false,
            quantity: 1,
            sortOrder: 0,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(TechnicalSheetInvalidValuesError);
  });

  it('rejeita ficha em produto supply', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        productId: 'supply-1',
        productionType: 'automatic',
        maxRemovableComponents: 0,
        markupPercent: 0,
        components: [],
        optionComponents: [],
      }),
    ).rejects.toBeInstanceOf(TechnicalSheetNotEligibleError);
  });

  it('rejeita produto inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        organizationId: STORE_ID,
        productId: 'missing',
        productionType: 'automatic',
        maxRemovableComponents: 0,
        markupPercent: 0,
        components: [],
        optionComponents: [],
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
