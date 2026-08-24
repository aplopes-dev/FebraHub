import { Module } from '@nestjs/common';
import { ListAllStockMovementsRoute } from './infrastructure/http/routes/list-all-stock-movements/list-all-stock-movements.route';
import { AdjustStockBatchRoute } from './infrastructure/http/routes/adjust-stock-batch/adjust-stock-batch.route';
import { CreateProductRoute } from './infrastructure/http/routes/create-product/create-product.route';
import { ListProductsRoute } from './infrastructure/http/routes/list-products/list-products.route';
import { GetProductByIdRoute } from './infrastructure/http/routes/get-product-by-id/get-product-by-id.route';
import { UpdateProductRoute } from './infrastructure/http/routes/update-product/update-product.route';
import { ToggleProductActiveRoute } from './infrastructure/http/routes/toggle-product-active/toggle-product-active.route';
import { DeleteProductRoute } from './infrastructure/http/routes/delete-product/delete-product.route';
import { AdjustStockRoute } from './infrastructure/http/routes/adjust-stock/adjust-stock.route';
import { ListStockMovementsRoute } from './infrastructure/http/routes/list-stock-movements/list-stock-movements.route';

import { ListAllStockMovementsUseCase } from './application/use-cases/list-all-stock-movements/list-all-stock-movements.use-case';
import { AdjustStockBatchUseCase } from './application/use-cases/adjust-stock-batch/adjust-stock-batch.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product/create-product.use-case';
import { ListProductsUseCase } from './application/use-cases/list-products/list-products.use-case';
import { GetProductByIdUseCase } from './application/use-cases/get-product-by-id/get-product-by-id.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product/update-product.use-case';
import { ToggleProductActiveUseCase } from './application/use-cases/toggle-product-active/toggle-product-active.use-case';
import { DeleteProductUseCase } from './application/use-cases/delete-product/delete-product.use-case';
import { AdjustStockUseCase } from './application/use-cases/adjust-stock/adjust-stock.use-case';
import { ListStockMovementsUseCase } from './application/use-cases/list-stock-movements/list-stock-movements.use-case';

import { PrismaProductRepository } from './infrastructure/database/prisma-product.repository';
import { ProductRepository } from './domain/repositories/product.repository.interface';

@Module({
  controllers: [
    ListAllStockMovementsRoute,
    AdjustStockBatchRoute,
    CreateProductRoute,
    ListProductsRoute,
    GetProductByIdRoute,
    UpdateProductRoute,
    ToggleProductActiveRoute,
    DeleteProductRoute,
    AdjustStockRoute,
    ListStockMovementsRoute,
  ],
  providers: [
    {
      provide: ProductRepository,
      useClass: PrismaProductRepository,
    },
    ListAllStockMovementsUseCase,
    AdjustStockBatchUseCase,
    CreateProductUseCase,
    ListProductsUseCase,
    GetProductByIdUseCase,
    UpdateProductUseCase,
    ToggleProductActiveUseCase,
    DeleteProductUseCase,
    AdjustStockUseCase,
    ListStockMovementsUseCase,
  ],
  exports: [ProductRepository],
})
export class ProductsModule {}
