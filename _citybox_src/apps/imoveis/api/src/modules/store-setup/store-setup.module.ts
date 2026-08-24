import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { EnsurePlatformStoreOwnerUseCase } from './application/use-cases/ensure-platform-store-owner/ensure-platform-store-owner.use-case';
import { ProvisionPlatformStoreUseCase } from './application/use-cases/provision-platform-store/provision-platform-store.use-case';
import { EventDedupeService } from './infrastructure/messaging/event-dedupe.service';
import { StorePlatformConsumer } from './infrastructure/messaging/consumers/store-platform.consumer';
import { ProvisionPlatformStoreRoute } from './infrastructure/http/routes/provision-platform-store/provision-platform-store.route';

@Module({
  imports: [PrismaModule, SettingsModule, TenancyModule],
  controllers: [ProvisionPlatformStoreRoute],
  providers: [
    EventDedupeService,
    EnsurePlatformStoreOwnerUseCase,
    ProvisionPlatformStoreUseCase,
    StorePlatformConsumer,
  ],
})
export class StoreSetupModule {}
