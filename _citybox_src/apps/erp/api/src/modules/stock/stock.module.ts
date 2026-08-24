import { Module } from '@nestjs/common';

import { TenancyModule } from '../tenancy/tenancy.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CarriersModule } from './carriers/carriers.module';

import { StockRepository } from './domain/repositories/stock.repository.interface';
import { PrismaStockRepository } from './infrastructure/database/prisma-stock.repository';
import { MovementCategoryRepository } from './domain/repositories/movement-category.repository.interface';
import { PrismaMovementCategoryRepository } from './infrastructure/database/prisma-movement-category.repository';
import {
  StockMovementRepository,
  StockProductLookup,
} from './domain/repositories/stock-movement.repository.interface';
import { PrismaStockMovementRepository } from './infrastructure/database/prisma-stock-movement.repository';
import { PrismaStockProductLookup } from './infrastructure/database/prisma-stock-product-lookup';

import { CreateStockUseCase } from './application/use-cases/create-stock/create-stock.use-case';
import { ListStocksUseCase } from './application/use-cases/list-stocks/list-stocks.use-case';
import { FindStockByIdUseCase } from './application/use-cases/find-stock-by-id/find-stock-by-id.use-case';
import { UpdateStockUseCase } from './application/use-cases/update-stock/update-stock.use-case';
import { DeleteStockUseCase } from './application/use-cases/delete-stock/delete-stock.use-case';

import { CreateMovementCategoryUseCase } from './application/use-cases/create-movement-category/create-movement-category.use-case';
import { ListMovementCategoriesUseCase } from './application/use-cases/list-movement-categories/list-movement-categories.use-case';
import { FindMovementCategoryByIdUseCase } from './application/use-cases/find-movement-category-by-id/find-movement-category-by-id.use-case';
import { UpdateMovementCategoryUseCase } from './application/use-cases/update-movement-category/update-movement-category.use-case';
import { DeleteMovementCategoryUseCase } from './application/use-cases/delete-movement-category/delete-movement-category.use-case';
import { ListMovementCategoryOptionsUseCase } from './application/use-cases/list-movement-category-options/list-movement-category-options.use-case';

import { CreateStockMovementUseCase } from './application/use-cases/create-stock-movement/create-stock-movement.use-case';
import { ListStockMovementsUseCase } from './application/use-cases/list-stock-movements/list-stock-movements.use-case';
import { FindStockMovementByIdUseCase } from './application/use-cases/find-stock-movement-by-id/find-stock-movement-by-id.use-case';
import { ListStockBalanceUseCase } from './application/use-cases/list-stock-balance/list-stock-balance.use-case';
import { ListProductStockMovementsUseCase } from './application/use-cases/list-product-stock-movements/list-product-stock-movements.use-case';

import { CreateInventoryUseCase } from './application/use-cases/create-inventory/create-inventory.use-case';
import { ListInventoriesUseCase } from './application/use-cases/list-inventories/list-inventories.use-case';
import { FindInventoryByIdUseCase } from './application/use-cases/find-inventory-by-id/find-inventory-by-id.use-case';
import { InventoryRepository } from './domain/repositories/inventory.repository.interface';
import { PrismaInventoryRepository } from './infrastructure/database/prisma-inventory.repository';

import { CreateStockTransferUseCase } from './application/use-cases/create-stock-transfer/create-stock-transfer.use-case';
import { ListStockTransfersUseCase } from './application/use-cases/list-stock-transfers/list-stock-transfers.use-case';
import { CancelStockTransferUseCase } from './application/use-cases/cancel-stock-transfer/cancel-stock-transfer.use-case';
import { StockTransferRepository } from './domain/repositories/stock-transfer.repository.interface';
import { PrismaStockTransferRepository } from './infrastructure/database/prisma-stock-transfer.repository';

import { CreatePurchaseUseCase } from './application/use-cases/create-purchase/create-purchase.use-case';
import { UpdatePurchaseUseCase } from './application/use-cases/update-purchase/update-purchase.use-case';
import { ListPurchasesUseCase } from './application/use-cases/list-purchases/list-purchases.use-case';
import { FindPurchaseByIdUseCase } from './application/use-cases/find-purchase-by-id/find-purchase-by-id.use-case';
import { DeletePurchaseUseCase } from './application/use-cases/delete-purchase/delete-purchase.use-case';
import { RestorePurchaseUseCase } from './application/use-cases/restore-purchase/restore-purchase.use-case';
import { PurchaseRepository } from './domain/repositories/purchase.repository.interface';
import { PrismaPurchaseRepository } from './infrastructure/database/prisma-purchase.repository';

import { CreateProductionOrderUseCase } from './application/use-cases/create-production-order/create-production-order.use-case';
import { ListProductionOrdersUseCase } from './application/use-cases/list-production-orders/list-production-orders.use-case';
import { FindProductionOrderByIdUseCase } from './application/use-cases/find-production-order-by-id/find-production-order-by-id.use-case';
import { StartProductionOrderUseCase } from './application/use-cases/start-production-order/start-production-order.use-case';
import { CancelProductionOrderUseCase } from './application/use-cases/cancel-production-order/cancel-production-order.use-case';
import { FinalizeProductionOrderUseCase } from './application/use-cases/finalize-production-order/finalize-production-order.use-case';
import { ListProductionHistoryUseCase } from './application/use-cases/list-production-history/list-production-history.use-case';
import { AddProductionHistoryCommentUseCase } from './application/use-cases/add-production-history-comment/add-production-history-comment.use-case';
import { ProductionOrderRepository } from './domain/repositories/production-order.repository.interface';
import { PrismaProductionOrderRepository } from './infrastructure/database/prisma-production-order.repository';
import { ProductionBomLookup } from './domain/repositories/production-bom.lookup.interface';
import { PrismaProductionBomLookup } from './infrastructure/database/prisma-production-bom.lookup';

import { ListStocksRoute } from './infrastructure/http/routes/list-stocks/list-stocks.route';
import { CreateStockRoute } from './infrastructure/http/routes/create-stock/create-stock.route';
import { ListStockBalanceRoute } from './infrastructure/http/routes/list-stock-balance/list-stock-balance.route';
import { ListProductStockMovementsRoute } from './infrastructure/http/routes/list-product-stock-movements/list-product-stock-movements.route';
import { ListInventoriesRoute } from './infrastructure/http/routes/list-inventories/list-inventories.route';
import { CreateInventoryRoute } from './infrastructure/http/routes/create-inventory/create-inventory.route';
import { FindInventoryByIdRoute } from './infrastructure/http/routes/find-inventory-by-id/find-inventory-by-id.route';
import { FindStockByIdRoute } from './infrastructure/http/routes/find-stock-by-id/find-stock-by-id.route';
import { UpdateStockRoute } from './infrastructure/http/routes/update-stock/update-stock.route';
import { DeleteStockRoute } from './infrastructure/http/routes/delete-stock/delete-stock.route';

import { ListMovementCategoriesRoute } from './infrastructure/http/routes/list-movement-categories/list-movement-categories.route';
import { CreateMovementCategoryRoute } from './infrastructure/http/routes/create-movement-category/create-movement-category.route';
import { ListMovementCategoryOptionsRoute } from './infrastructure/http/routes/list-movement-category-options/list-movement-category-options.route';
import { FindMovementCategoryByIdRoute } from './infrastructure/http/routes/find-movement-category-by-id/find-movement-category-by-id.route';
import { UpdateMovementCategoryRoute } from './infrastructure/http/routes/update-movement-category/update-movement-category.route';
import { DeleteMovementCategoryRoute } from './infrastructure/http/routes/delete-movement-category/delete-movement-category.route';

import { ListStockMovementsRoute } from './infrastructure/http/routes/list-stock-movements/list-stock-movements.route';
import { CreateStockMovementRoute } from './infrastructure/http/routes/create-stock-movement/create-stock-movement.route';
import { FindStockMovementByIdRoute } from './infrastructure/http/routes/find-stock-movement-by-id/find-stock-movement-by-id.route';

import { ListStockTransfersRoute } from './infrastructure/http/routes/list-stock-transfers/list-stock-transfers.route';
import { CreateStockTransferRoute } from './infrastructure/http/routes/create-stock-transfer/create-stock-transfer.route';
import { CancelStockTransferRoute } from './infrastructure/http/routes/cancel-stock-transfer/cancel-stock-transfer.route';

import { ListPurchasesRoute } from './infrastructure/http/routes/list-purchases/list-purchases.route';
import { CreatePurchaseRoute } from './infrastructure/http/routes/create-purchase/create-purchase.route';
import { FindPurchaseByIdRoute } from './infrastructure/http/routes/find-purchase-by-id/find-purchase-by-id.route';
import { UpdatePurchaseRoute } from './infrastructure/http/routes/update-purchase/update-purchase.route';
import { DeletePurchaseRoute } from './infrastructure/http/routes/delete-purchase/delete-purchase.route';
import { RestorePurchaseRoute } from './infrastructure/http/routes/restore-purchase/restore-purchase.route';

import { ListProductionOrdersRoute } from './infrastructure/http/routes/list-production-orders/list-production-orders.route';
import { CreateProductionOrderRoute } from './infrastructure/http/routes/create-production-order/create-production-order.route';
import { StartProductionOrderRoute } from './infrastructure/http/routes/start-production-order/start-production-order.route';
import { CancelProductionOrderRoute } from './infrastructure/http/routes/cancel-production-order/cancel-production-order.route';
import { FinalizeProductionOrderRoute } from './infrastructure/http/routes/finalize-production-order/finalize-production-order.route';
import { ListProductionHistoryRoute } from './infrastructure/http/routes/list-production-history/list-production-history.route';
import { AddProductionHistoryCommentRoute } from './infrastructure/http/routes/add-production-history-comment/add-production-history-comment.route';
import { FindProductionOrderByIdRoute } from './infrastructure/http/routes/find-production-order-by-id/find-production-order-by-id.route';

/**
 * Módulo de estoque — depósitos, categorias, ledger, inventário, transferências,
 * fornecedores e transportadoras.
 */
@Module({
  imports: [TenancyModule, SuppliersModule, CarriersModule],
  controllers: [
    ListStocksRoute,
    CreateStockRoute,
    // rotas fixas sob stocks/:id/* ANTES de :id
    ListStockBalanceRoute,
    ListProductStockMovementsRoute,
    ListInventoriesRoute,
    CreateInventoryRoute,
    FindStockByIdRoute,
    UpdateStockRoute,
    DeleteStockRoute,
    ListMovementCategoriesRoute,
    CreateMovementCategoryRoute,
    ListMovementCategoryOptionsRoute,
    FindMovementCategoryByIdRoute,
    UpdateMovementCategoryRoute,
    DeleteMovementCategoryRoute,
    ListStockMovementsRoute,
    CreateStockMovementRoute,
    FindStockMovementByIdRoute,
    FindInventoryByIdRoute,
    ListStockTransfersRoute,
    CreateStockTransferRoute,
    CancelStockTransferRoute,
    // rotas fixas antes de :id
    ListPurchasesRoute,
    CreatePurchaseRoute,
    FindPurchaseByIdRoute,
    UpdatePurchaseRoute,
    DeletePurchaseRoute,
    RestorePurchaseRoute,
    // rotas fixas sob production-orders/:id/* ANTES de :id
    ListProductionOrdersRoute,
    CreateProductionOrderRoute,
    StartProductionOrderRoute,
    CancelProductionOrderRoute,
    FinalizeProductionOrderRoute,
    ListProductionHistoryRoute,
    AddProductionHistoryCommentRoute,
    FindProductionOrderByIdRoute,
  ],
  providers: [
    { provide: StockRepository, useClass: PrismaStockRepository },
    CreateStockUseCase,
    ListStocksUseCase,
    FindStockByIdUseCase,
    UpdateStockUseCase,
    DeleteStockUseCase,
    {
      provide: MovementCategoryRepository,
      useClass: PrismaMovementCategoryRepository,
    },
    CreateMovementCategoryUseCase,
    ListMovementCategoriesUseCase,
    FindMovementCategoryByIdUseCase,
    UpdateMovementCategoryUseCase,
    DeleteMovementCategoryUseCase,
    ListMovementCategoryOptionsUseCase,
    {
      provide: StockMovementRepository,
      useClass: PrismaStockMovementRepository,
    },
    { provide: StockProductLookup, useClass: PrismaStockProductLookup },
    CreateStockMovementUseCase,
    ListStockMovementsUseCase,
    FindStockMovementByIdUseCase,
    ListStockBalanceUseCase,
    ListProductStockMovementsUseCase,
    { provide: InventoryRepository, useClass: PrismaInventoryRepository },
    CreateInventoryUseCase,
    ListInventoriesUseCase,
    FindInventoryByIdUseCase,
    {
      provide: StockTransferRepository,
      useClass: PrismaStockTransferRepository,
    },
    CreateStockTransferUseCase,
    ListStockTransfersUseCase,
    CancelStockTransferUseCase,
    { provide: PurchaseRepository, useClass: PrismaPurchaseRepository },
    CreatePurchaseUseCase,
    UpdatePurchaseUseCase,
    ListPurchasesUseCase,
    FindPurchaseByIdUseCase,
    DeletePurchaseUseCase,
    RestorePurchaseUseCase,
    {
      provide: ProductionOrderRepository,
      useClass: PrismaProductionOrderRepository,
    },
    { provide: ProductionBomLookup, useClass: PrismaProductionBomLookup },
    CreateProductionOrderUseCase,
    ListProductionOrdersUseCase,
    FindProductionOrderByIdUseCase,
    StartProductionOrderUseCase,
    CancelProductionOrderUseCase,
    FinalizeProductionOrderUseCase,
    ListProductionHistoryUseCase,
    AddProductionHistoryCommentUseCase,
  ],
  exports: [
    SuppliersModule,
    CarriersModule,
    StockRepository,
    MovementCategoryRepository,
    StockMovementRepository,
    StockProductLookup,
    InventoryRepository,
    StockTransferRepository,
    PurchaseRepository,
    ProductionOrderRepository,
  ],
})
export class StockModule {}
