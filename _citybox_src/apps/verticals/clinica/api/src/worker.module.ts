import { Module } from '@nestjs/common';
import { PrismaModule } from './shared/infra/prisma/prisma.module';
import { StorageModule } from './shared/infra/storage/storage.module';
import { StoreSetupModule } from './modules/store-setup/store-setup.module';
import { StorePlatformConsumer } from './modules/store-setup/infrastructure/messaging/consumers/store-platform.consumer';

@Module({
  imports: [PrismaModule, StorageModule, StoreSetupModule],
  providers: [StorePlatformConsumer],
})
export class WorkerModule {}
