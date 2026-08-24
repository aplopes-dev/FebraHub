import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PermissionGuard } from './auth/permission.guard.js';
import { AuthModule } from './auth/auth.module.js';
import { AuthMiddleware } from './auth/auth.middleware.js';
import { CatalogController } from './catalog/catalog.controller.js';
import { DevicesController } from './devices/devices.controller.js';
import { HealthController } from './health/health.controller.js';
import { HierarchyController } from './platform/hierarchy.controller.js';
import { InventoryController } from './inventory/inventory.controller.js';
import { OrdersController } from './orders/orders.controller.js';
import { PaymentsModule } from './payments/payments.module.js';
import { OutboxModule } from './outbox/outbox.module.js';
import { PlatformModule } from './platform/platform.module.js';
import { SchedulingController } from './scheduling/scheduling.controller.js';
import { ShippingController } from './shipping/shipping.controller.js';
import { TenancyModule } from './tenancy/tenancy.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [PlatformModule, TenancyModule, AuthModule, OutboxModule, UsersModule, PaymentsModule],
  providers: [{ provide: APP_GUARD, useClass: PermissionGuard }],
  controllers: [
    HealthController,
    HierarchyController,
    DevicesController,
    CatalogController,
    InventoryController,
    SchedulingController,
    OrdersController,
    ShippingController,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'health/ready', method: RequestMethod.GET },
        { path: 'v1/internal/payments/webhooks', method: RequestMethod.POST },
      )
      .forRoutes({ path: 'v1/*path', method: RequestMethod.ALL });
  }
}