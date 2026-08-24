import {
  BRANCH_ID,
  OTHER_BRANCH_ID,
} from '../../../../tenancy/tests/tenancy-test-factory';
import { ListProductsUseCase } from './list-products.use-case';
import { InMemoryProductRepository } from '../../../tests/in-memory-product.repository';
import { InMemoryStockMovementRepository } from '../../../../stock/tests/in-memory-stock-movement.repository';
import {
  makeProduct,
  OTHER_STORE_ID,
  STORE_ID,
} from '../../../tests/catalog-test-factory';

describe('ListProductsUseCase', () => {
  let repository: InMemoryProductRepository;
  let stockMovementRepository: InMemoryStockMovementRepository;
  let useCase: ListProductsUseCase;

  beforeEach(async () => {
    repository = new InMemoryProductRepository();
    stockMovementRepository = new InMemoryStockMovementRepository();
    useCase = new ListProductsUseCase(repository, stockMovementRepository);

    await repository.save(
      makeProduct({ name: 'Camiseta', sku: 'A-1', basePriceCents: 5990 }, 'p1'),
    );
    await repository.save(
      makeProduct(
        { name: 'Calça', sku: 'A-2', basePriceCents: 14990, hasVariants: true },
        'p2',
      ),
    );
    await repository.save(
      makeProduct(
        { name: 'Farinha', sku: 'B-1', basePriceCents: 1250, type: 'supply' },
        'p3',
      ),
    );
    await repository.save(
      makeProduct(
        { name: 'Antigo', sku: 'C-1', deletedAt: new Date('2026-01-01') },
        'p4',
      ),
    );
    await repository.save(
      makeProduct(
        { name: 'De outra loja', sku: 'Z-9', organizationId: OTHER_STORE_ID },
        'p5',
      ),
    );
  });

  it('recorta a listagem pela unidade quando branchId é informado', async () => {
    await repository.save(
      makeProduct({ sku: 'SO-MATRIZ', branchIds: [BRANCH_ID] }, 'p-matriz'),
    );
    await repository.save(
      makeProduct(
        { sku: 'SO-FILIAL', branchIds: [OTHER_BRANCH_ID] },
        'p-filial',
      ),
    );

    const result = await useCase.execute({
      organizationId: STORE_ID,
      branchId: BRANCH_ID,
    });

    const skus = result.products.map((product) => product.sku);
    expect(skus).toContain('SO-MATRIZ');
    expect(skus).not.toContain('SO-FILIAL');
  });

  it('lista o catálogo da empresa inteira sem branchId', async () => {
    await repository.save(
      makeProduct({ sku: 'SO-MATRIZ', branchIds: [BRANCH_ID] }, 'p-matriz'),
    );
    await repository.save(
      makeProduct({ sku: 'SEM-UNIDADE', branchIds: [] }, 'p-sem-unidade'),
    );

    const result = await useCase.execute({ organizationId: STORE_ID });

    const skus = result.products.map((product) => product.sku);
    // Sem recorte, até o produto sem vínculo aparece — ele existe no cadastro.
    expect(skus).toContain('SO-MATRIZ');
    expect(skus).toContain('SEM-UNIDADE');
  });

  it('lista só os produtos ativos da loja informada', async () => {
    const result = await useCase.execute({ organizationId: STORE_ID });

    expect(result.total).toBe(3);
    expect(result.products.map((p) => p.id).sort()).toEqual(['p1', 'p2', 'p3']);
  });

  it('não vaza produtos de outra loja', async () => {
    const result = await useCase.execute({ organizationId: STORE_ID });

    expect(
      result.products.some((p) => p.organizationId === OTHER_STORE_ID),
    ).toBe(false);
  });

  it('calcula tabCounts sobre o catálogo inteiro, ignorando busca', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      search: 'nada-encontra',
    });

    expect(result.total).toBe(0);
    expect(result.tabCounts).toEqual({
      all: 3,
      with_variants: 1,
      supplies: 1,
      deleted: 1,
    });
  });

  it('calcula tabCounts recortados pela unidade quando branchId é informado', async () => {
    await repository.save(
      makeProduct(
        { sku: 'MATRIZ-1', hasVariants: true, branchIds: [BRANCH_ID] },
        'pb1',
      ),
    );
    await repository.save(
      makeProduct(
        { sku: 'MATRIZ-2', type: 'supply', branchIds: [BRANCH_ID] },
        'pb2',
      ),
    );
    await repository.save(
      makeProduct({ sku: 'FILIAL-1', branchIds: [OTHER_BRANCH_ID] }, 'pb3'),
    );

    const result = await useCase.execute({
      organizationId: STORE_ID,
      branchId: BRANCH_ID,
    });

    expect(result.tabCounts).toEqual({
      all: 2,
      with_variants: 1,
      supplies: 1,
      deleted: 0,
    });
    expect(result.total).toBe(2);
  });

  it('filtra pela aba "Excluídos"', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      tab: 'deleted',
    });

    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.id).toBe('p4');
  });

  it('filtra pela aba "Com variação"', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      tab: 'with_variants',
    });

    expect(result.products.map((p) => p.id)).toEqual(['p2']);
  });

  it('filtra pela aba "Insumos"', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      tab: 'supplies',
    });

    expect(result.products.map((p) => p.id)).toEqual(['p3']);
  });

  it('busca por nome e por SKU', async () => {
    const byName = await useCase.execute({
      organizationId: STORE_ID,
      search: 'camis',
    });
    expect(byName.products.map((p) => p.id)).toEqual(['p1']);

    const bySku = await useCase.execute({
      organizationId: STORE_ID,
      search: 'a-2',
    });
    expect(bySku.products.map((p) => p.id)).toEqual(['p2']);
  });

  it('ordena por preço', async () => {
    const asc = await useCase.execute({
      organizationId: STORE_ID,
      sort: 'price_asc',
    });
    expect(asc.products.map((p) => p.id)).toEqual(['p3', 'p1', 'p2']);

    const desc = await useCase.execute({
      organizationId: STORE_ID,
      sort: 'price_desc',
    });
    expect(desc.products.map((p) => p.id)).toEqual(['p2', 'p1', 'p3']);
  });

  it('pagina no repositório e devolve meta coerente', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      perPage: 2,
      page: 2,
    });

    expect(result.products).toHaveLength(1);
    expect(result.page).toBe(2);
    expect(result.perPage).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.total).toBe(3);
  });

  it('clampa a página quando ela passa do total', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      perPage: 2,
      page: 99,
    });

    expect(result.page).toBe(2);
    expect(result.products).toHaveLength(1);
  });

  it('limita perPage ao teto de 100', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      perPage: 5000,
    });

    expect(result.perPage).toBe(100);
  });

  it('filtra por tipo', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      types: ['supply'],
    });

    expect(result.products.map((p) => p.id)).toEqual(['p3']);
  });

  // Aba e filtro podem tocar a mesma coluna; têm de se INTERSECCIONAR (AND),
  // nunca um sobrescrever o outro (bug real corrigido no repositório Prisma).
  it('intersecciona aba e filtro contraditórios em vez de sobrescrever', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      tab: 'supplies',
      types: ['simple'],
    });

    expect(result.products).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('intersecciona aba "Com variação" com filtro variants=without', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      tab: 'with_variants',
      variants: 'without',
    });

    expect(result.products).toHaveLength(0);
  });

  it('aba "Insumos" + filtro de tipo compatível mantém o resultado', async () => {
    const result = await useCase.execute({
      organizationId: STORE_ID,
      tab: 'supplies',
      types: ['supply'],
    });

    expect(result.products.map((p) => p.id)).toEqual(['p3']);
  });

  it('filtra apenas produtos com trackStock quando trackStock=true', async () => {
    await repository.save(
      makeProduct({ sku: 'RASTREADO-1', trackStock: true }, 'p-track-1'),
    );
    await repository.save(
      makeProduct({ sku: 'RASTREADO-2', trackStock: true }, 'p-track-2'),
    );

    const result = await useCase.execute({
      organizationId: STORE_ID,
      trackStock: true,
    });

    expect(result.products.map((p) => p.id).sort()).toEqual([
      'p-track-1',
      'p-track-2',
    ]);
  });

  it('não filtra por trackStock quando o parâmetro não é informado', async () => {
    await repository.save(
      makeProduct({ sku: 'RASTREADO-1', trackStock: true }, 'p-track-1'),
    );

    const result = await useCase.execute({ organizationId: STORE_ID });

    expect(result.total).toBe(4);
  });

  it('ordena por stock_asc / stock_desc com saldo branch-aware', async () => {
    await repository.save(
      makeProduct(
        {
          name: 'Alto',
          sku: 'STK-HI',
          trackStock: true,
          branchIds: [BRANCH_ID, OTHER_BRANCH_ID],
        },
        'p-hi',
      ),
    );
    await repository.save(
      makeProduct(
        {
          name: 'Baixo',
          sku: 'STK-LO',
          trackStock: true,
          branchIds: [BRANCH_ID, OTHER_BRANCH_ID],
        },
        'p-lo',
      ),
    );

    stockMovementRepository.setBalance(STORE_ID, 'stock-a', 'p-hi', '100');
    stockMovementRepository.setBalance(STORE_ID, 'stock-a', 'p-lo', '5');
    stockMovementRepository.setBalance(STORE_ID, 'stock-b', 'p-hi', '50');
    stockMovementRepository.linkStockToBranch('stock-a', BRANCH_ID);
    stockMovementRepository.linkStockToBranch('stock-b', OTHER_BRANCH_ID);

    const ascOrg = await useCase.execute({
      organizationId: STORE_ID,
      sort: 'stock_asc',
      trackStock: true,
    });
    expect(ascOrg.products.map((p) => p.id)).toEqual(['p-lo', 'p-hi']);

    const descBranch = await useCase.execute({
      organizationId: STORE_ID,
      sort: 'stock_desc',
      trackStock: true,
      branchId: BRANCH_ID,
    });
    // Na unidade BRANCH: hi=100, lo=5 (saldo do stock-b não entra)
    expect(descBranch.products.map((p) => p.id)).toEqual(['p-hi', 'p-lo']);
  });

  it('filtra in_stock / out_of_stock e trata trackStock=false como 0', async () => {
    await repository.save(
      makeProduct({ name: 'Com saldo', sku: 'IN-1', trackStock: true }, 'p-in'),
    );
    await repository.save(
      makeProduct({ name: 'Zerado', sku: 'OUT-1', trackStock: true }, 'p-out'),
    );
    await repository.save(
      makeProduct(
        { name: 'Sem controle', sku: 'NT-1', trackStock: false },
        'p-nt',
      ),
    );

    stockMovementRepository.setBalance(STORE_ID, 'stock-a', 'p-in', '10');
    stockMovementRepository.setBalance(STORE_ID, 'stock-a', 'p-out', '0');
    stockMovementRepository.setBalance(STORE_ID, 'stock-a', 'p-nt', '99');
    stockMovementRepository.linkStockToBranch('stock-a', BRANCH_ID);

    const inStock = await useCase.execute({
      organizationId: STORE_ID,
      stockFilter: 'in_stock',
    });
    expect(inStock.products.map((p) => p.id)).toEqual(['p-in']);

    const outStock = await useCase.execute({
      organizationId: STORE_ID,
      stockFilter: 'out_of_stock',
      sort: 'name_asc',
    });
    const outIds = outStock.products.map((p) => p.id);
    expect(outIds).toContain('p-out');
    expect(outIds).toContain('p-nt');
    expect(outIds).not.toContain('p-in');
  });

  it('pagina de forma estável com sort stock_desc', async () => {
    for (let i = 1; i <= 5; i += 1) {
      const id = `p-page-${i}`;
      await repository.save(
        makeProduct({ name: `P${i}`, sku: `PAGE-${i}`, trackStock: true }, id),
      );
      stockMovementRepository.setBalance(
        STORE_ID,
        'stock-a',
        id,
        String(i * 10),
      );
    }
    stockMovementRepository.linkStockToBranch('stock-a', BRANCH_ID);

    const page1 = await useCase.execute({
      organizationId: STORE_ID,
      sort: 'stock_desc',
      trackStock: true,
      page: 1,
      perPage: 2,
    });
    const page2 = await useCase.execute({
      organizationId: STORE_ID,
      sort: 'stock_desc',
      trackStock: true,
      page: 2,
      perPage: 2,
    });

    expect(page1.total).toBe(5);
    expect(page1.products.map((p) => p.id)).toEqual(['p-page-5', 'p-page-4']);
    expect(page2.products.map((p) => p.id)).toEqual(['p-page-3', 'p-page-2']);
  });
});
