import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListProductsUseCase } from '../../../../application/use-cases/list-products/list-products.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { Tenant } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { PriceListRepository } from '../../../../domain/repositories/price-list.repository.interface';
import { StockMovementRepository } from '../../../../../stock/domain/repositories/stock-movement.repository.interface';
import { ProductPresenter } from '../shared/product.presenter';
import {
  parseCsvParam,
  parseOptionalBoolean,
  parsePositiveInt,
  parseSort,
  parseStockFilter,
  parseTab,
  parseTypes,
  parseVariants,
} from './list-products.query';

@ApiTags('products')
@Controller('v1/products')
@RequirePermission('store.catalog.manage')
export class ListProductsRoute {
  constructor(
    private readonly listProducts: ListProductsUseCase,
    private readonly priceListRepository: PriceListRepository,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos (paginado, filtrado e ordenado)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({
    name: 'tab',
    required: false,
    enum: ['all', 'with_variants', 'supplies', 'deleted'],
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({
    name: 'types',
    required: false,
    description: 'CSV: simple,collection,supply',
  })
  @ApiQuery({
    name: 'variants',
    required: false,
    enum: ['all', 'with', 'without'],
  })
  @ApiQuery({
    name: 'categories',
    required: false,
    description: 'CSV de categoryId',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description:
      'Recorta pelo vínculo com a unidade. Omitido, usa a unidade ativa (header X-Branch-Id); sem nenhuma das duas, lista o catálogo da empresa.',
  })
  @ApiQuery({
    name: 'trackStock',
    required: false,
    description: 'Quando `true`, só produtos com controle de estoque.',
  })
  @ApiQuery({
    name: 'stock',
    required: false,
    enum: ['in_stock', 'out_of_stock'],
    description: 'Filtro por saldo agregado (escopo da unidade ativa).',
  })
  @ApiQuery({
    name: 'availableOnErp',
    required: false,
    description:
      'Quando `true`/`false`, filtra por disponibilidade no ERP. Pickers de venda: `availableOnErp=true`.',
  })
  @ApiQuery({
    name: 'availableOnPdv',
    required: false,
    description: 'Quando `true`/`false`, filtra por disponibilidade no PDV.',
  })
  async handle(
    @Tenant() tenant: TenantContext,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('tab') tab?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('types') types?: string | string[],
    @Query('variants') variants?: string,
    @Query('categories') categories?: string | string[],
    @Query('branchId') branchId?: string,
    @Query('trackStock') trackStock?: string,
    @Query('stock') stock?: string,
    @Query('availableOnErp') availableOnErp?: string,
    @Query('availableOnPdv') availableOnPdv?: string,
  ) {
    const effectiveBranchId = branchId?.trim() || tenant.branchId;

    const result = await this.listProducts.execute({
      organizationId: tenant.organizationId,
      page: parsePositiveInt(page),
      perPage: parsePositiveInt(perPage),
      tab: parseTab(tab),
      search:
        typeof search === 'string' ? search.trim() || undefined : undefined,
      sort: parseSort(sort),
      types: parseTypes(types),
      variants: parseVariants(variants),
      categoryIds: parseCsvParam(categories),
      branchId: effectiveBranchId,
      trackStock:
        trackStock === 'true' || trackStock === '1' ? true : undefined,
      stockFilter: parseStockFilter(stock),
      availableOnErp: parseOptionalBoolean(availableOnErp),
      availableOnPdv: parseOptionalBoolean(availableOnPdv),
    });

    const productIds = result.products.map((product) => product.id);

    const [priceListsByProductId, stockByProductId] = await Promise.all([
      this.priceListRepository.findNamesByProductIds(
        tenant.organizationId,
        productIds,
      ),
      this.stockMovementRepository.sumQuantitiesByProductIds(
        tenant.organizationId,
        productIds,
        { branchId: effectiveBranchId ?? undefined },
      ),
    ]);

    return ProductPresenter.toHttpList(
      result.products,
      {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      result.tabCounts,
      priceListsByProductId,
      stockByProductId,
    );
  }
}
