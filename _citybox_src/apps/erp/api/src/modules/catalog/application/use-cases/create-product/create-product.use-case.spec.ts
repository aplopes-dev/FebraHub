import { CreateProductUseCase } from './create-product.use-case';
import { ProductSkuTakenError } from '../../../domain/errors/product-sku-taken.error';
import { ProductCategoryNotFoundError } from '../../../domain/errors/product-category-not-found.error';
import { UnitOfMeasureNotFoundError } from '../../../domain/errors/unit-of-measure-not-found.error';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { BranchNotFoundError } from '../../../../tenancy/domain/errors/branch-not-found.error';
import { SupplierNotFoundError } from '../../../../stock/suppliers/domain/errors/supplier-not-found.error';
import {
  makeSupplier,
  SUPPLIER_ID,
  OTHER_SUPPLIER_ID,
} from '../../../../stock/suppliers/tests/suppliers-test-factory';
import {
  BRANCH_ID,
  OTHER_BRANCH_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import {
  ADDON_ID,
  OTHER_ADDON_ID,
  OTHER_PRODUCT_ID,
  baseCreateInput,
  makeAddon,
  makeCategory,
  makeProduct,
  makeRepositories,
  makeUnit,
  makeVariation,
  OTHER_CATEGORY_ID,
  OTHER_STORE_ID,
  OTHER_UNIT_ID,
  STORE_ID,
  VARIATION_ID,
  VARIATION_OPTION_ID,
} from '../../../tests/catalog-test-factory';
import { VariationNotFoundError } from '../../../domain/errors/variation-not-found.error';
import { ProductAddonNotFoundError } from '../../../domain/errors/product-addon-not-found.error';
import { ProductAddonDuplicateLineError } from '../../../domain/errors/product-addon-duplicate-line.error';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductSuggestionDuplicateLineError } from '../../../domain/errors/product-suggestion-duplicate-line.error';

describe('CreateProductUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedSupport();
    const useCase = new CreateProductUseCase(
      repos.productRepository,
      repos.categoryRepository,
      repos.unitRepository,
      repos.branchRepository,
      repos.supplierRepository,
      repos.variationRepository,
      repos.addonRepository,
    );
    return { ...repos, useCase };
  }

  it('vincula fornecedores com código e fator de conversão', async () => {
    const { useCase, supplierRepository } = await setup();
    await supplierRepository.save(makeSupplier());

    const product = await useCase.execute({
      ...baseCreateInput(),
      suppliers: [
        { supplierId: SUPPLIER_ID, supplierCode: 'ABC-123', conversion: 12 },
      ],
    });

    expect(product.suppliers).toEqual([
      { supplierId: SUPPLIER_ID, supplierCode: 'ABC-123', conversion: 12 },
    ]);
  });

  it('mantém só o último vínculo quando o fornecedor se repete', async () => {
    // O formulário permite linhas repetidas; o unique do banco recusaria.
    const { useCase, supplierRepository } = await setup();
    await supplierRepository.save(makeSupplier());

    const product = await useCase.execute({
      ...baseCreateInput(),
      suppliers: [
        { supplierId: SUPPLIER_ID, supplierCode: 'ANTIGO', conversion: 1 },
        { supplierId: SUPPLIER_ID, supplierCode: 'NOVO', conversion: 6 },
      ],
    });

    expect(product.suppliers).toHaveLength(1);
    expect(product.suppliers[0]?.supplierCode).toBe('NOVO');
  });

  it('rejeita fornecedor que não é da organização', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        suppliers: [
          { supplierId: OTHER_SUPPLIER_ID, supplierCode: null, conversion: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(SupplierNotFoundError);
  });

  it('vincula o produto às unidades informadas', async () => {
    const { useCase } = await setup();

    const product = await useCase.execute({
      ...baseCreateInput(),
      branchIds: [BRANCH_ID],
    });

    expect(product.branchIds).toEqual([BRANCH_ID]);
  });

  it('nasce sem unidade quando branchIds é omitido', async () => {
    // Produto sem vínculo existe no cadastro da empresa mas não opera em
    // nenhuma filial — é o estado de um item recém-criado.
    const { useCase } = await setup();

    const product = await useCase.execute(baseCreateInput());

    expect(product.branchIds).toEqual([]);
  });

  it('descarta unidades repetidas', async () => {
    const { useCase } = await setup();

    const product = await useCase.execute({
      ...baseCreateInput(),
      branchIds: [BRANCH_ID, BRANCH_ID],
    });

    expect(product.branchIds).toEqual([BRANCH_ID]);
  });

  it('rejeita unidade que não é da organização', async () => {
    // A FK composta do banco também barraria, mas com erro de integridade cru.
    // Aqui o usuário recebe 404 dizendo qual unidade não existe.
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        branchIds: [OTHER_BRANCH_ID],
      }),
    ).rejects.toBeInstanceOf(BranchNotFoundError);
  });

  it('cria um produto com os dados informados', async () => {
    const { useCase, productRepository } = await setup();

    const product = await useCase.execute(baseCreateInput());

    expect(product.id).toBeDefined();
    expect(product.name).toBe('Camiseta Básica');
    expect(product.sku).toBe('CAM-001');
    expect(product.basePriceCents).toBe(5990);
    expect(product.isDeleted()).toBe(false);
    expect(productRepository.getAll()).toHaveLength(1);
  });

  it('rejeita SKU já usado na mesma loja', async () => {
    const { useCase } = await setup();
    await useCase.execute(baseCreateInput());

    await expect(useCase.execute(baseCreateInput())).rejects.toBeInstanceOf(
      ProductSkuTakenError,
    );
  });

  it('permite o mesmo SKU em lojas diferentes', async () => {
    const { useCase, categoryRepository, unitRepository } = await setup();
    // A outra loja precisa dos próprios cadastros de apoio, com ids distintos.
    await categoryRepository.save(
      makeCategory({ organizationId: OTHER_STORE_ID, id: OTHER_CATEGORY_ID }),
    );
    await unitRepository.save(
      makeUnit({ organizationId: OTHER_STORE_ID, id: OTHER_UNIT_ID }),
    );

    await useCase.execute(baseCreateInput());
    const other = await useCase.execute({
      ...baseCreateInput(),
      organizationId: OTHER_STORE_ID,
      categoryId: OTHER_CATEGORY_ID,
      unitOfMeasureId: OTHER_UNIT_ID,
    });

    expect(other.organizationId).toBe(OTHER_STORE_ID);
    expect(other.sku).toBe('CAM-001');
  });

  it('rejeita categoria inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        categoryId: '99999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toBeInstanceOf(ProductCategoryNotFoundError);
  });

  it('rejeita unidade de medida inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        unitOfMeasureId: '99999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toBeInstanceOf(UnitOfMeasureNotFoundError);
  });

  it('aceita produto sem unidade de medida', async () => {
    const { useCase } = await setup();

    const product = await useCase.execute({
      ...baseCreateInput(),
      unitOfMeasureId: null,
    });

    expect(product.unitOfMeasureId).toBeNull();
  });

  it('normaliza códigos de barras: remove vazios e duplicados', async () => {
    const { useCase } = await setup();

    const product = await useCase.execute({
      ...baseCreateInput(),
      barcodes: ['  7891234567895 ', '', '7891234567895', '  ', '789000'],
    });

    expect(product.barcodes).toEqual(['7891234567895', '789000']);
  });

  it('rejeita nome vazio pela validação de domínio', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ ...baseCreateInput(), name: '   ' }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejeita preço negativo pela validação de domínio', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ ...baseCreateInput(), basePriceCents: -1 }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('escopa a busca de SKU pela loja informada', async () => {
    const { useCase, productRepository } = await setup();
    await useCase.execute(baseCreateInput());

    const found = await productRepository.findBySku(STORE_ID, 'cam-001');
    expect(found).not.toBeNull();

    const otherStore = await productRepository.findBySku(
      OTHER_STORE_ID,
      'CAM-001',
    );
    expect(otherStore).toBeNull();
  });

  it('vincula variações e sincroniza hasVariants/variantsCount', async () => {
    const { useCase, variationRepository } = await setup();
    await variationRepository.save(makeVariation());

    const product = await useCase.execute({
      ...baseCreateInput(),
      variationFormat: 'grid',
      variations: [
        {
          variationId: VARIATION_ID,
          optionIds: [VARIATION_OPTION_ID],
          minChoices: 1,
          maxChoices: 1,
        },
      ],
    });

    expect(product.variationFormat).toBe('grid');
    expect(product.variations).toHaveLength(1);
    expect(product.variations[0]?.variationId).toBe(VARIATION_ID);
    expect(product.hasVariants).toBe(true);
    expect(product.variantsCount).toBe(1);
  });

  it('rejeita variação inexistente na organização', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        variations: [
          {
            variationId: VARIATION_ID,
            optionIds: [VARIATION_OPTION_ID],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(VariationNotFoundError);
  });

  it('salva addonSettings e addonLines e devolve exatamente o que foi enviado', async () => {
    const { useCase, addonRepository } = await setup();
    await addonRepository.save(makeAddon());
    await addonRepository.save(
      makeAddon({ id: OTHER_ADDON_ID, name: 'Queijo cheddar' }),
    );

    const product = await useCase.execute({
      ...baseCreateInput(),
      addonSettings: {
        minQuantity: 1,
        maxQuantity: 3,
        chargeFromSelectedQuantity: true,
        chargeFromQuantity: 2,
      },
      addonLines: [
        { addonId: ADDON_ID, maxQuantity: 2, priceCents: 350, sortOrder: 0 },
        {
          addonId: OTHER_ADDON_ID,
          maxQuantity: 1,
          priceCents: 200,
          sortOrder: 1,
        },
      ],
    });

    expect(product.addonSettings).toEqual({
      minQuantity: 1,
      maxQuantity: 3,
      chargeFromSelectedQuantity: true,
      chargeFromQuantity: 2,
    });
    expect(product.addonLines).toHaveLength(2);
    expect(product.addonLines[0]).toEqual({
      addonId: ADDON_ID,
      maxQuantity: 2,
      priceCents: 350,
      sortOrder: 0,
    });
  });

  it('nasce com addonSettings default quando omitido (FR-011)', async () => {
    const { useCase } = await setup();

    const product = await useCase.execute(baseCreateInput());

    expect(product.addonSettings).toEqual({
      minQuantity: 0,
      maxQuantity: 0,
      chargeFromSelectedQuantity: false,
      chargeFromQuantity: 1,
    });
    expect(product.addonLines).toEqual([]);
  });

  it('rejeita minQuantity > maxQuantity sem persistir nada (FR-007, FR-012)', async () => {
    const { useCase, productRepository } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        addonSettings: {
          minQuantity: 5,
          maxQuantity: 1,
          chargeFromSelectedQuantity: false,
          chargeFromQuantity: 1,
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
    expect(productRepository.getAll()).toHaveLength(0);
  });

  it('rejeita chargeFromSelectedQuantity ativo sem chargeFromQuantity >= 1 (FR-006)', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        addonSettings: {
          minQuantity: 0,
          maxQuantity: 1,
          chargeFromSelectedQuantity: true,
          chargeFromQuantity: 0,
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);
  });

  it('rejeita addonId duplicado nas linhas (FR-009)', async () => {
    const { useCase, addonRepository } = await setup();
    await addonRepository.save(makeAddon());

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        addonLines: [
          { addonId: ADDON_ID, maxQuantity: 1, priceCents: 350 },
          { addonId: ADDON_ID, maxQuantity: 2, priceCents: 400 },
        ],
      }),
    ).rejects.toBeInstanceOf(ProductAddonDuplicateLineError);
  });

  it('rejeita addonId inexistente na organização (FR-008)', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        addonLines: [{ addonId: ADDON_ID, maxQuantity: 1, priceCents: 350 }],
      }),
    ).rejects.toBeInstanceOf(ProductAddonNotFoundError);
  });

  it('salva suggestions e devolve exatamente o que foi enviado', async () => {
    const { useCase, productRepository } = await setup();
    const other = await productRepository.save(
      makeProduct({ sku: 'REFRI-001' }, OTHER_PRODUCT_ID),
    );

    const product = await useCase.execute({
      ...baseCreateInput(),
      suggestions: [{ suggestedProductId: other.id, sortOrder: 0 }],
    });

    expect(product.suggestions).toEqual([
      { suggestedProductId: other.id, sortOrder: 0 },
    ]);
  });

  it('nasce sem sugestões quando omitido (FR-017)', async () => {
    const { useCase } = await setup();

    const product = await useCase.execute(baseCreateInput());

    expect(product.suggestions).toEqual([]);
  });

  it('rejeita suggestedProductId duplicado (FR-014)', async () => {
    const { useCase, productRepository } = await setup();
    const other = await productRepository.save(
      makeProduct({ sku: 'REFRI-001' }, OTHER_PRODUCT_ID),
    );

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        suggestions: [
          { suggestedProductId: other.id, sortOrder: 0 },
          { suggestedProductId: other.id, sortOrder: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(ProductSuggestionDuplicateLineError);
  });

  it('rejeita produto sugerido inexistente na organização', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        suggestions: [
          { suggestedProductId: '99999999-9999-4999-8999-999999999999' },
        ],
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('grava availableOnErp/availableOnPdv (default true)', async () => {
    const { useCase } = await setup();

    const defaults = await useCase.execute(baseCreateInput());
    expect(defaults.availableOnErp).toBe(true);
    expect(defaults.availableOnPdv).toBe(true);

    const custom = await useCase.execute({
      ...baseCreateInput(),
      sku: 'CAM-002',
      availableOnErp: false,
      availableOnPdv: false,
    });
    expect(custom.availableOnErp).toBe(false);
    expect(custom.availableOnPdv).toBe(false);
  });

  // Autossugestão (FR-015) no create depende do id gerado internamente pelo
  // use case (o produto ainda não existe antes da chamada) — coberto de forma
  // determinística em UpdateProductUseCase.spec.ts, onde o id é conhecido.
});
