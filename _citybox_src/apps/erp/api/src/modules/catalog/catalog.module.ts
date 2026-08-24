import { Module } from '@nestjs/common';

import { TenancyModule } from '../tenancy/tenancy.module';
import { StockModule } from '../stock/stock.module';
import { FiscalDefaultsModule } from '../fiscal-defaults/fiscal-defaults.module';

import { ProductRepository } from './domain/repositories/product.repository.interface';
import { ProductCategoryRepository } from './domain/repositories/product-category.repository.interface';
import { UnitOfMeasureRepository } from './domain/repositories/unit-of-measure.repository.interface';
import { VariationRepository } from './domain/repositories/variation.repository.interface';
import { PriceListRepository } from './domain/repositories/price-list.repository.interface';
import { ProductFiscalRepository } from './domain/repositories/product-fiscal.repository.interface';
import { TechnicalSheetRepository } from './domain/repositories/technical-sheet.repository.interface';
import { ProductAddonRepository } from './domain/repositories/product-addon.repository.interface';
import { PrismaProductRepository } from './infrastructure/database/prisma-product.repository';
import { PrismaProductCategoryRepository } from './infrastructure/database/prisma-product-category.repository';
import { PrismaUnitOfMeasureRepository } from './infrastructure/database/prisma-unit-of-measure.repository';
import { PrismaVariationRepository } from './infrastructure/database/prisma-variation.repository';
import { PrismaPriceListRepository } from './infrastructure/database/prisma-price-list.repository';
import { PrismaProductFiscalRepository } from './infrastructure/database/prisma-product-fiscal.repository';
import { PrismaTechnicalSheetRepository } from './infrastructure/database/prisma-technical-sheet.repository';
import { PrismaProductAddonRepository } from './infrastructure/database/prisma-product-addon.repository';

import { ListProductsUseCase } from './application/use-cases/list-products/list-products.use-case';
import { FindProductByIdUseCase } from './application/use-cases/find-product-by-id/find-product-by-id.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product/create-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product/delete-product.use-case';
import { RestoreProductUseCase } from './application/use-cases/restore-product/restore-product.use-case';
import { BulkDeleteProductsUseCase } from './application/use-cases/bulk-delete-products/bulk-delete-products.use-case';
import { ListProductCategoriesUseCase } from './application/use-cases/list-product-categories/list-product-categories.use-case';
import { CreateProductCategoryUseCase } from './application/use-cases/create-product-category/create-product-category.use-case';
import { UpdateProductCategoryUseCase } from './application/use-cases/update-product-category/update-product-category.use-case';
import { DeleteProductCategoryUseCase } from './application/use-cases/delete-product-category/delete-product-category.use-case';
import { ListUnitsOfMeasureUseCase } from './application/use-cases/list-units-of-measure/list-units-of-measure.use-case';
import { CreateUnitOfMeasureUseCase } from './application/use-cases/create-unit-of-measure/create-unit-of-measure.use-case';
import { UpdateUnitOfMeasureUseCase } from './application/use-cases/update-unit-of-measure/update-unit-of-measure.use-case';
import { DeleteUnitOfMeasureUseCase } from './application/use-cases/delete-unit-of-measure/delete-unit-of-measure.use-case';
import { ListVariationsUseCase } from './application/use-cases/list-variations/list-variations.use-case';
import { FindVariationByIdUseCase } from './application/use-cases/find-variation-by-id/find-variation-by-id.use-case';
import { CreateVariationUseCase } from './application/use-cases/create-variation/create-variation.use-case';
import { UpdateVariationUseCase } from './application/use-cases/update-variation/update-variation.use-case';
import { DeleteVariationUseCase } from './application/use-cases/delete-variation/delete-variation.use-case';
import { UploadProductImageUseCase } from './application/use-cases/upload-product-image/upload-product-image.use-case';
import { GetProductImageUseCase } from './application/use-cases/get-product-image/get-product-image.use-case';
import { DeleteProductImageUseCase } from './application/use-cases/delete-product-image/delete-product-image.use-case';
import { ListPriceListsUseCase } from './application/use-cases/list-price-lists/list-price-lists.use-case';
import { FindPriceListByIdUseCase } from './application/use-cases/find-price-list-by-id/find-price-list-by-id.use-case';
import { CreatePriceListUseCase } from './application/use-cases/create-price-list/create-price-list.use-case';
import { UpdatePriceListUseCase } from './application/use-cases/update-price-list/update-price-list.use-case';
import { DeletePriceListUseCase } from './application/use-cases/delete-price-list/delete-price-list.use-case';
import { ReorderPriceListsUseCase } from './application/use-cases/reorder-price-lists/reorder-price-lists.use-case';
import { ListPriceListItemsUseCase } from './application/use-cases/list-price-list-items/list-price-list-items.use-case';
import { ReplacePriceListItemsUseCase } from './application/use-cases/replace-price-list-items/replace-price-list-items.use-case';
import { ListFiscalParametersUseCase } from './application/use-cases/list-fiscal-parameters/list-fiscal-parameters.use-case';
import { FindFiscalParametersByProductIdUseCase } from './application/use-cases/find-fiscal-parameters-by-product-id/find-fiscal-parameters-by-product-id.use-case';
import { UpsertFiscalParametersUseCase } from './application/use-cases/upsert-fiscal-parameters/upsert-fiscal-parameters.use-case';
import { ListTechnicalSheetsUseCase } from './application/use-cases/list-technical-sheets/list-technical-sheets.use-case';
import { FindTechnicalSheetByProductIdUseCase } from './application/use-cases/find-technical-sheet-by-product-id/find-technical-sheet-by-product-id.use-case';
import { UpsertTechnicalSheetUseCase } from './application/use-cases/upsert-technical-sheet/upsert-technical-sheet.use-case';
import { CreateProductAddonUseCase } from './application/use-cases/create-product-addon/create-product-addon.use-case';
import { UpdateProductAddonUseCase } from './application/use-cases/update-product-addon/update-product-addon.use-case';
import { DeleteProductAddonUseCase } from './application/use-cases/delete-product-addon/delete-product-addon.use-case';
import { ListProductAddonsUseCase } from './application/use-cases/list-product-addons/list-product-addons.use-case';
import { DuplicateProductUseCase } from './application/use-cases/duplicate-product/duplicate-product.use-case';
import { GetProductImportTemplateUseCase } from './application/use-cases/get-product-import-template/get-product-import-template.use-case';
import { ImportProductsUseCase } from './application/use-cases/import-products/import-products.use-case';
import { UploadVariationOptionImageUseCase } from './application/use-cases/upload-variation-option-image/upload-variation-option-image.use-case';
import { GetVariationOptionImageUseCase } from './application/use-cases/get-variation-option-image/get-variation-option-image.use-case';
import { DeleteVariationOptionImageUseCase } from './application/use-cases/delete-variation-option-image/delete-variation-option-image.use-case';

import { ListProductsRoute } from './infrastructure/http/routes/list-products/list-products.route';
import { BulkDeleteProductsRoute } from './infrastructure/http/routes/bulk-delete-products/bulk-delete-products.route';
import { RestoreProductRoute } from './infrastructure/http/routes/restore-product/restore-product.route';
import { CreateProductRoute } from './infrastructure/http/routes/create-product/create-product.route';
import { UpdateProductRoute } from './infrastructure/http/routes/update-product/update-product.route';
import { DeleteProductRoute } from './infrastructure/http/routes/delete-product/delete-product.route';
import { FindProductByIdRoute } from './infrastructure/http/routes/find-product-by-id/find-product-by-id.route';
import { ProductImageRoute } from './infrastructure/http/routes/product-image/product-image.route';
import { DuplicateProductRoute } from './infrastructure/http/routes/duplicate-product/duplicate-product.route';
import { GetProductImportTemplateRoute } from './infrastructure/http/routes/import-products/get-product-import-template.route';
import { ImportProductsRoute } from './infrastructure/http/routes/import-products/import-products.route';
import { VariationOptionImageRoute } from './infrastructure/http/routes/variation-option-image/variation-option-image.route';
import { ListProductCategoriesRoute } from './infrastructure/http/routes/list-product-categories/list-product-categories.route';
import { CreateProductCategoryRoute } from './infrastructure/http/routes/create-product-category/create-product-category.route';
import { UpdateProductCategoryRoute } from './infrastructure/http/routes/update-product-category/update-product-category.route';
import { DeleteProductCategoryRoute } from './infrastructure/http/routes/delete-product-category/delete-product-category.route';
import { ListUnitsOfMeasureRoute } from './infrastructure/http/routes/list-units-of-measure/list-units-of-measure.route';
import { CreateUnitOfMeasureRoute } from './infrastructure/http/routes/create-unit-of-measure/create-unit-of-measure.route';
import { UpdateUnitOfMeasureRoute } from './infrastructure/http/routes/update-unit-of-measure/update-unit-of-measure.route';
import { DeleteUnitOfMeasureRoute } from './infrastructure/http/routes/delete-unit-of-measure/delete-unit-of-measure.route';
import { ListVariationsRoute } from './infrastructure/http/routes/list-variations/list-variations.route';
import { CreateVariationRoute } from './infrastructure/http/routes/create-variation/create-variation.route';
import { UpdateVariationRoute } from './infrastructure/http/routes/update-variation/update-variation.route';
import { DeleteVariationRoute } from './infrastructure/http/routes/delete-variation/delete-variation.route';
import { FindVariationByIdRoute } from './infrastructure/http/routes/find-variation-by-id/find-variation-by-id.route';
import { ListPriceListsRoute } from './infrastructure/http/routes/list-price-lists/list-price-lists.route';
import { CreatePriceListRoute } from './infrastructure/http/routes/create-price-list/create-price-list.route';
import { ReorderPriceListsRoute } from './infrastructure/http/routes/reorder-price-lists/reorder-price-lists.route';
import { ListPriceListItemsRoute } from './infrastructure/http/routes/list-price-list-items/list-price-list-items.route';
import { ReplacePriceListItemsRoute } from './infrastructure/http/routes/replace-price-list-items/replace-price-list-items.route';
import { FindPriceListByIdRoute } from './infrastructure/http/routes/find-price-list-by-id/find-price-list-by-id.route';
import { UpdatePriceListRoute } from './infrastructure/http/routes/update-price-list/update-price-list.route';
import { DeletePriceListRoute } from './infrastructure/http/routes/delete-price-list/delete-price-list.route';
import { ListFiscalParametersRoute } from './infrastructure/http/routes/list-fiscal-parameters/list-fiscal-parameters.route';
import { FindFiscalParametersByProductIdRoute } from './infrastructure/http/routes/find-fiscal-parameters-by-product-id/find-fiscal-parameters-by-product-id.route';
import { UpsertFiscalParametersRoute } from './infrastructure/http/routes/upsert-fiscal-parameters/upsert-fiscal-parameters.route';
import { ListTechnicalSheetsRoute } from './infrastructure/http/routes/list-technical-sheets/list-technical-sheets.route';
import { FindTechnicalSheetByProductIdRoute } from './infrastructure/http/routes/find-technical-sheet-by-product-id/find-technical-sheet-by-product-id.route';
import { UpsertTechnicalSheetRoute } from './infrastructure/http/routes/upsert-technical-sheet/upsert-technical-sheet.route';
import { CreateProductAddonRoute } from './infrastructure/http/routes/create-product-addon/create-product-addon.route';
import { UpdateProductAddonRoute } from './infrastructure/http/routes/update-product-addon/update-product-addon.route';
import { DeleteProductAddonRoute } from './infrastructure/http/routes/delete-product-addon/delete-product-addon.route';
import { ListProductAddonsRoute } from './infrastructure/http/routes/list-product-addons/list-product-addons.route';

@Module({
  // TenancyModule: criar/editar produto valida as unidades pelo BranchRepository.
  // TenancyModule/StockModule: o produto valida unidades e fornecedores.
  // FiscalDefaultsModule exporta FiscalGroupRepository: o upsert de parâmetros
  // fiscais valida o pisCofinsGroupId (org + PIS_COFINS) — spec erp/015.
  imports: [TenancyModule, StockModule, FiscalDefaultsModule],
  // Ordem importa: rotas de caminho fixo (`bulk-delete`, `reorder`) antes das
  // que usam parâmetro (`:id`), para o Nest não casar o path fixo como id.
  controllers: [
    ListProductsRoute,
    GetProductImportTemplateRoute,
    ImportProductsRoute,
    BulkDeleteProductsRoute,
    RestoreProductRoute,
    CreateProductRoute,
    DuplicateProductRoute,
    UpdateProductRoute,
    DeleteProductRoute,
    FindProductByIdRoute,
    ProductImageRoute,
    ListProductCategoriesRoute,
    CreateProductCategoryRoute,
    UpdateProductCategoryRoute,
    DeleteProductCategoryRoute,
    ListUnitsOfMeasureRoute,
    CreateUnitOfMeasureRoute,
    UpdateUnitOfMeasureRoute,
    DeleteUnitOfMeasureRoute,
    ListVariationsRoute,
    CreateVariationRoute,
    UpdateVariationRoute,
    DeleteVariationRoute,
    VariationOptionImageRoute,
    FindVariationByIdRoute,
    ListPriceListsRoute,
    CreatePriceListRoute,
    ReorderPriceListsRoute,
    ListPriceListItemsRoute,
    ReplacePriceListItemsRoute,
    FindPriceListByIdRoute,
    UpdatePriceListRoute,
    DeletePriceListRoute,
    ListFiscalParametersRoute,
    UpsertFiscalParametersRoute,
    FindFiscalParametersByProductIdRoute,
    ListTechnicalSheetsRoute,
    UpsertTechnicalSheetRoute,
    FindTechnicalSheetByProductIdRoute,
    ListProductAddonsRoute,
    CreateProductAddonRoute,
    UpdateProductAddonRoute,
    DeleteProductAddonRoute,
  ],
  providers: [
    { provide: ProductRepository, useClass: PrismaProductRepository },
    {
      provide: ProductCategoryRepository,
      useClass: PrismaProductCategoryRepository,
    },
    {
      provide: UnitOfMeasureRepository,
      useClass: PrismaUnitOfMeasureRepository,
    },
    { provide: VariationRepository, useClass: PrismaVariationRepository },
    { provide: PriceListRepository, useClass: PrismaPriceListRepository },
    {
      provide: ProductFiscalRepository,
      useClass: PrismaProductFiscalRepository,
    },
    {
      provide: TechnicalSheetRepository,
      useClass: PrismaTechnicalSheetRepository,
    },
    {
      provide: ProductAddonRepository,
      useClass: PrismaProductAddonRepository,
    },
    ListProductsUseCase,
    FindProductByIdUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    RestoreProductUseCase,
    BulkDeleteProductsUseCase,
    ListProductCategoriesUseCase,
    CreateProductCategoryUseCase,
    UpdateProductCategoryUseCase,
    DeleteProductCategoryUseCase,
    ListUnitsOfMeasureUseCase,
    CreateUnitOfMeasureUseCase,
    UpdateUnitOfMeasureUseCase,
    DeleteUnitOfMeasureUseCase,
    ListVariationsUseCase,
    FindVariationByIdUseCase,
    CreateVariationUseCase,
    UpdateVariationUseCase,
    DeleteVariationUseCase,
    UploadProductImageUseCase,
    GetProductImageUseCase,
    DeleteProductImageUseCase,
    ListPriceListsUseCase,
    FindPriceListByIdUseCase,
    CreatePriceListUseCase,
    UpdatePriceListUseCase,
    DeletePriceListUseCase,
    ReorderPriceListsUseCase,
    ListPriceListItemsUseCase,
    ReplacePriceListItemsUseCase,
    ListFiscalParametersUseCase,
    FindFiscalParametersByProductIdUseCase,
    UpsertFiscalParametersUseCase,
    ListTechnicalSheetsUseCase,
    FindTechnicalSheetByProductIdUseCase,
    UpsertTechnicalSheetUseCase,
    CreateProductAddonUseCase,
    UpdateProductAddonUseCase,
    DeleteProductAddonUseCase,
    ListProductAddonsUseCase,
    DuplicateProductUseCase,
    GetProductImportTemplateUseCase,
    ImportProductsUseCase,
    UploadVariationOptionImageUseCase,
    GetVariationOptionImageUseCase,
    DeleteVariationOptionImageUseCase,
  ],
  exports: [
    ProductRepository,
    ProductCategoryRepository,
    UnitOfMeasureRepository,
    VariationRepository,
    PriceListRepository,
    ProductFiscalRepository,
    TechnicalSheetRepository,
    ProductAddonRepository,
  ],
})
export class CatalogModule {}
