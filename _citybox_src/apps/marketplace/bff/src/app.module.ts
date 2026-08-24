import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health/health.controller.js';
import { CacheService } from './cache/cache.service.js';
import { KeycloakService } from './auth/keycloak.service.js';
import { JwtAuthGuard } from './auth/jwt.guard.js';
import { UsersService } from './users/users.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { MeController } from './users/me.controller.js';
import { MeService } from './users/me.service.js';
import { CatalogController } from './catalog/catalog.controller.js';
import { CatalogService } from './catalog/catalog.service.js';
import { ReviewsController } from './catalog/reviews.controller.js';
import { ReviewsService } from './catalog/reviews.service.js';
import { SearchHistoryController } from './catalog/search-history.controller.js';
import { AddressesController } from './addresses/addresses.controller.js';
import { AddressesService } from './addresses/addresses.service.js';
import { PaymentMethodsController } from './payment-methods/payment-methods.controller.js';
import { PaymentMethodsService } from './payment-methods/payment-methods.service.js';
import { FavoritesController } from './favorites/favorites.controller.js';
import { FavoritesService } from './favorites/favorites.service.js';
import { CartController } from './cart/cart.controller.js';
import { CartService } from './cart/cart.service.js';
import { CheckoutController } from './checkout/checkout.controller.js';
import { CheckoutService } from './checkout/checkout.service.js';
import { OrdersController } from './orders/orders.controller.js';
import { OrdersService } from './orders/orders.service.js';
import { CoreOrdersService } from './orders/core-orders.service.js';
import { EngagementController } from './engagement/engagement.controller.js';
import { EngagementService } from './engagement/engagement.service.js';
import { ContentController } from './content/content.controller.js';
import { ContentService } from './content/content.service.js';

@Module({
  controllers: [
    HealthController,
    AuthController,
    MeController,
    CatalogController,
    ReviewsController,
    SearchHistoryController,
    AddressesController,
    PaymentMethodsController,
    FavoritesController,
    CartController,
    CheckoutController,
    OrdersController,
    EngagementController,
    ContentController,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    CacheService,
    KeycloakService,
    UsersService,
    AuthService,
    MeService,
    CatalogService,
    ReviewsService,
    AddressesService,
    PaymentMethodsService,
    FavoritesService,
    CartService,
    CheckoutService,
    OrdersService,
    CoreOrdersService,
    EngagementService,
    ContentService,
  ],
})
export class AppModule {}
