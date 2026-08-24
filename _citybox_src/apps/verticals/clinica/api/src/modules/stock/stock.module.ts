import { Module } from '@nestjs/common';

import { StockSuppliersRoute } from './infrastructure/http/routes/stock-suppliers/stock-suppliers.route';
import { StockProductsRoute } from './infrastructure/http/routes/stock-products/stock-products.route';
import { StockProductPhotoRoute } from './infrastructure/http/routes/stock-products/stock-product-photo.route';
import { StockEntriesRoute } from './infrastructure/http/routes/stock-entries/stock-entries.route';
import { StockWithdrawalsRoute } from './infrastructure/http/routes/stock-withdrawals/stock-withdrawals.route';
import { StockMovementsRoute } from './infrastructure/http/routes/stock-movements/stock-movements.route';
import { StockStatsRoute } from './infrastructure/http/routes/stock-stats/stock-stats.route';

import { StockSupplierRepository } from './domain/repositories/stock-supplier.repository';
import { StockProductRepository } from './domain/repositories/stock-product.repository';
import { StockMovementRepository } from './domain/repositories/stock-movement.repository';

import { PrismaStockSupplierRepository } from './infrastructure/database/prisma-stock-supplier.repository';
import { PrismaStockProductRepository } from './infrastructure/database/prisma-stock-product.repository';
import { PrismaStockMovementRepository } from './infrastructure/database/prisma-stock-movement.repository';

import { ListStockSuppliersUseCase } from './application/use-cases/suppliers/list-stock-suppliers.use-case';
import { CreateStockSupplierUseCase } from './application/use-cases/suppliers/create-stock-supplier.use-case';
import { UpdateStockSupplierUseCase } from './application/use-cases/suppliers/update-stock-supplier.use-case';
import { DeleteStockSupplierUseCase } from './application/use-cases/suppliers/delete-stock-supplier.use-case';

import { ListStockProductsUseCase } from './application/use-cases/products/list-stock-products.use-case';
import { CreateStockProductUseCase } from './application/use-cases/products/create-stock-product.use-case';
import { UpdateStockProductUseCase } from './application/use-cases/products/update-stock-product.use-case';
import { DeleteStockProductUseCase } from './application/use-cases/products/delete-stock-product.use-case';

import { UploadStockProductPhotoUseCase } from './application/use-cases/products/upload-stock-product-photo.use-case';
import { GetStockProductPhotoUseCase } from './application/use-cases/products/get-stock-product-photo.use-case';
import { DeleteStockProductPhotoUseCase } from './application/use-cases/products/delete-stock-product-photo.use-case';

import { CreateStockEntryUseCase } from './application/use-cases/entries/create-stock-entry.use-case';
import { CreateStockBulkEntryUseCase } from './application/use-cases/entries/create-stock-bulk-entry.use-case';
import { CreateStockWithdrawalUseCase } from './application/use-cases/withdrawals/create-stock-withdrawal.use-case';

import { ListStockMovementsUseCase } from './application/use-cases/movements/list-stock-movements.use-case';
import { GetStockStatsUseCase } from './application/use-cases/stats/get-stock-stats.use-case';

@Module({
  controllers: [
    StockSuppliersRoute,
    StockProductsRoute,
    StockProductPhotoRoute,
    StockEntriesRoute,
    StockWithdrawalsRoute,
    StockMovementsRoute,
    StockStatsRoute,
  ],
  providers: [
    {
      provide: StockSupplierRepository,
      useClass: PrismaStockSupplierRepository,
    },
    { provide: StockProductRepository, useClass: PrismaStockProductRepository },
    {
      provide: StockMovementRepository,
      useClass: PrismaStockMovementRepository,
    },

    ListStockSuppliersUseCase,
    CreateStockSupplierUseCase,
    UpdateStockSupplierUseCase,
    DeleteStockSupplierUseCase,

    ListStockProductsUseCase,
    CreateStockProductUseCase,
    UpdateStockProductUseCase,
    DeleteStockProductUseCase,

    UploadStockProductPhotoUseCase,
    GetStockProductPhotoUseCase,
    DeleteStockProductPhotoUseCase,

    CreateStockEntryUseCase,
    CreateStockBulkEntryUseCase,
    CreateStockWithdrawalUseCase,

    ListStockMovementsUseCase,
    GetStockStatsUseCase,
  ],
})
export class StockModule {}
