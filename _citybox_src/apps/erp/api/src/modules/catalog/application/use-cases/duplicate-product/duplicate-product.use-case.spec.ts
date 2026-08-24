import { DuplicateProductUseCase } from './duplicate-product.use-case';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import {
  ADDON_ID,
  OTHER_PRODUCT_ID,
  PRODUCT_ID,
  STORE_ID,
  VARIATION_ID,
  VARIATION_OPTION_ID,
  makeAddon,
  makeProduct,
  makeRepositories,
  makeVariation,
} from '../../../tests/catalog-test-factory';
import { BRANCH_ID } from '../../../../tenancy/tests/tenancy-test-factory';

describe('DuplicateProductUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedSupport();
    await repos.variationRepository.save(makeVariation());
    await repos.addonRepository.save(makeAddon());
    const useCase = new DuplicateProductUseCase(repos.productRepository);
    return { ...repos, useCase };
  }

  it('clona escalares, branches, barcodes, adicionais e sugestões sem imagem', async () => {
    const { useCase, productRepository } = await setup();
    const source = makeProduct(
      {
        name: 'Camiseta',
        sku: 'CAM-001',
        branchIds: [BRANCH_ID],
        barcodes: ['789'],
        availableOnErp: false,
        availableOnPdv: true,
        variationFormat: 'grid',
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
        addonSettings: {
          minQuantity: 0,
          maxQuantity: 2,
          chargeFromSelectedQuantity: false,
          chargeFromQuantity: 1,
        },
        addonLines: [
          { addonId: ADDON_ID, maxQuantity: 2, priceCents: 350, sortOrder: 0 },
        ],
        suggestions: [{ suggestedProductId: OTHER_PRODUCT_ID, sortOrder: 0 }],
      },
      PRODUCT_ID,
    );
    source.setImage('org/catalogo/products/x.jpg');
    await productRepository.save(source);
    await productRepository.save(
      makeProduct({ name: 'Outro', sku: 'OTHER' }, OTHER_PRODUCT_ID),
    );

    const clone = await useCase.execute({
      organizationId: STORE_ID,
      productId: PRODUCT_ID,
    });

    expect(clone.id).not.toBe(PRODUCT_ID);
    expect(clone.name).toBe('Camiseta (cópia)');
    expect(clone.sku).toBe('CAM-001-COPIA');
    expect(clone.imageUrl).toBeNull();
    expect(clone.branchIds).toEqual([BRANCH_ID]);
    expect(clone.barcodes).toEqual(['789']);
    expect(clone.availableOnErp).toBe(false);
    expect(clone.availableOnPdv).toBe(true);
    expect(clone.variations).toHaveLength(1);
    expect(clone.addonLines).toEqual(source.addonLines);
    expect(clone.suggestions).toEqual(source.suggestions);
  });

  it('usa sufixo numérico quando SKU-COPIA já existe', async () => {
    const { useCase, productRepository } = await setup();
    await productRepository.save(makeProduct({ sku: 'CAM-001' }, PRODUCT_ID));
    await productRepository.save(
      makeProduct({ name: 'Já cópia', sku: 'CAM-001-COPIA' }, OTHER_PRODUCT_ID),
    );

    const clone = await useCase.execute({
      organizationId: STORE_ID,
      productId: PRODUCT_ID,
    });

    expect(clone.sku).toBe('CAM-001-COPIA-2');
  });

  it('404 se o produto não existe', async () => {
    const { useCase } = await setup();
    await expect(
      useCase.execute({ organizationId: STORE_ID, productId: PRODUCT_ID }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });
});
