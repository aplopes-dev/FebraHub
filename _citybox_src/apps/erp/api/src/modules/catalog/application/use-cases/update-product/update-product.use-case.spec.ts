import { UpdateProductUseCase } from './update-product.use-case';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductSkuTakenError } from '../../../domain/errors/product-sku-taken.error';
import {
  ADDON_ID,
  OTHER_PRODUCT_ID,
  baseCreateInput,
  makeAddon,
  makeProduct,
  makeRepositories,
  makeVariation,
  OTHER_STORE_ID,
  STORE_ID,
  VARIATION_ID,
  VARIATION_OPTION_ID,
} from '../../../tests/catalog-test-factory';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ProductSuggestionSelfReferenceError } from '../../../domain/errors/product-suggestion-self-reference.error';

describe('UpdateProductUseCase', () => {
  async function setup() {
    const repos = makeRepositories();
    await repos.seedSupport();
    await repos.productRepository.save(makeProduct({ sku: 'CAM-001' }, 'p1'));
    const useCase = new UpdateProductUseCase(
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

  it('atualiza os campos do produto', async () => {
    const { useCase } = await setup();

    const updated = await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      name: 'Camiseta Premium',
      basePriceCents: 9990,
    });

    expect(updated.name).toBe('Camiseta Premium');
    expect(updated.basePriceCents).toBe(9990);
  });

  it('atualiza flags de disponibilidade', async () => {
    const { useCase } = await setup();

    const updated = await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      availableOnErp: false,
      availableOnPdv: false,
    });

    expect(updated.availableOnErp).toBe(false);
    expect(updated.availableOnPdv).toBe(false);
  });

  it('mantém o próprio SKU sem acusar conflito', async () => {
    const { useCase } = await setup();

    const updated = await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      sku: 'CAM-001',
      name: 'Outro nome',
    });

    expect(updated.sku).toBe('CAM-001');
  });

  it('rejeita SKU que já pertence a outro produto', async () => {
    const { useCase, productRepository } = await setup();
    await productRepository.save(makeProduct({ sku: 'CAM-002' }, 'p2'));

    await expect(
      useCase.execute({ ...baseCreateInput(), id: 'p1', sku: 'CAM-002' }),
    ).rejects.toBeInstanceOf(ProductSkuTakenError);
  });

  it('404 para produto inexistente', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({ ...baseCreateInput(), id: 'nao-existe' }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('404 ao atualizar produto de outra loja', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        id: 'p1',
        organizationId: OTHER_STORE_ID,
      }),
    ).rejects.toBeInstanceOf(ProductNotFoundError);
  });

  it('avança o updatedAt', async () => {
    const { useCase, productRepository } = await setup();
    const before = (await productRepository.findById(STORE_ID, 'p1'))!
      .updatedAt;

    const updated = await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      name: 'Novo nome',
    });

    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
  });

  it('atualiza vínculos de variação e zera flags ao remover', async () => {
    const { useCase, variationRepository } = await setup();
    await variationRepository.save(makeVariation());

    const withVariants = await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      variationFormat: 'composite',
      variations: [
        {
          variationId: VARIATION_ID,
          optionIds: [VARIATION_OPTION_ID],
          minChoices: 1,
          maxChoices: 2,
        },
      ],
    });
    expect(withVariants.hasVariants).toBe(true);
    expect(withVariants.variantsCount).toBe(1);
    expect(withVariants.variationFormat).toBe('composite');

    const cleared = await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      variations: [],
    });
    expect(cleared.hasVariants).toBe(false);
    expect(cleared.variantsCount).toBe(0);
    expect(cleared.variationFormat).toBeNull();
  });

  it('salva addonSettings e addonLines e reler devolve exatamente o mesmo (round-trip)', async () => {
    const { useCase, addonRepository, productRepository } = await setup();
    await addonRepository.save(makeAddon());

    await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      addonSettings: {
        minQuantity: 1,
        maxQuantity: 3,
        chargeFromSelectedQuantity: true,
        chargeFromQuantity: 2,
      },
      addonLines: [
        { addonId: ADDON_ID, maxQuantity: 2, priceCents: 350, sortOrder: 0 },
      ],
    });

    const reloaded = await productRepository.findById(STORE_ID, 'p1');
    expect(reloaded?.addonSettings).toEqual({
      minQuantity: 1,
      maxQuantity: 3,
      chargeFromSelectedQuantity: true,
      chargeFromQuantity: 2,
    });
    expect(reloaded?.addonLines).toEqual([
      { addonId: ADDON_ID, maxQuantity: 2, priceCents: 350, sortOrder: 0 },
    ]);
  });

  it('mantém addonSettings existente quando omitido no update', async () => {
    const { useCase, productRepository } = await setup();
    await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      addonSettings: {
        minQuantity: 1,
        maxQuantity: 2,
        chargeFromSelectedQuantity: false,
        chargeFromQuantity: 1,
      },
    });

    await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      name: 'Novo nome',
    });

    const reloaded = await productRepository.findById(STORE_ID, 'p1');
    expect(reloaded?.addonSettings.minQuantity).toBe(1);
    expect(reloaded?.addonSettings.maxQuantity).toBe(2);
  });

  it('permite salvar a lista de adicionais vazia (FR-011)', async () => {
    const { useCase, addonRepository } = await setup();
    await addonRepository.save(makeAddon());
    await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      addonLines: [{ addonId: ADDON_ID, priceCents: 350 }],
    });

    const cleared = await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      addonLines: [],
    });

    expect(cleared.addonLines).toEqual([]);
  });

  it('rejeita minQuantity > maxQuantity sem persistir nada (FR-007, FR-012)', async () => {
    const { useCase, productRepository } = await setup();
    // Nada chega a `save()`: a validação de domínio dispara dentro de
    // `product.update()`, antes do use case devolver o produto ao repositório.
    const saveSpy = jest.spyOn(productRepository, 'save');

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        id: 'p1',
        addonSettings: {
          minQuantity: 5,
          maxQuantity: 1,
          chargeFromSelectedQuantity: false,
          chargeFromQuantity: 1,
        },
      }),
    ).rejects.toBeInstanceOf(ValidatorDomainError);

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('salva suggestions e reler devolve exatamente o mesmo (round-trip, FR-016)', async () => {
    const { useCase, productRepository } = await setup();
    await productRepository.save(
      makeProduct({ sku: 'REFRI-001' }, OTHER_PRODUCT_ID),
    );

    await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      suggestions: [{ suggestedProductId: OTHER_PRODUCT_ID, sortOrder: 0 }],
    });

    const reloaded = await productRepository.findById(STORE_ID, 'p1');
    expect(reloaded?.suggestions).toEqual([
      { suggestedProductId: OTHER_PRODUCT_ID, sortOrder: 0 },
    ]);
  });

  it('permite salvar a lista de sugestões vazia (FR-017)', async () => {
    const { useCase, productRepository } = await setup();
    await productRepository.save(
      makeProduct({ sku: 'REFRI-001' }, OTHER_PRODUCT_ID),
    );
    await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      suggestions: [{ suggestedProductId: OTHER_PRODUCT_ID }],
    });

    const cleared = await useCase.execute({
      ...baseCreateInput(),
      id: 'p1',
      suggestions: [],
    });

    expect(cleared.suggestions).toEqual([]);
  });

  it('rejeita autossugestão (FR-015)', async () => {
    const { useCase } = await setup();

    await expect(
      useCase.execute({
        ...baseCreateInput(),
        id: 'p1',
        suggestions: [{ suggestedProductId: 'p1' }],
      }),
    ).rejects.toBeInstanceOf(ProductSuggestionSelfReferenceError);
  });

  // FR-018 (produto sugerido excluído some da leitura, sem quebrar o produto
  // dono): implementado no `where` do `include` de `PrismaProductRepository`
  // (filtra `suggestedProduct.deletedAt IS NULL`) — o fake in-memory usado
  // aqui não replica joins/filtros do Prisma, então essa regra é validada via
  // `quickstart.md` passo 5 contra o banco real, não neste spec.
});
