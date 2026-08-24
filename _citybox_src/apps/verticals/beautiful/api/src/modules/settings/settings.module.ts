import { Module } from '@nestjs/common';
import { GetStoreSettingsUseCase } from './application/use-cases/get-store-settings/get-store-settings.use-case';
import { UpdateStoreSettingsUseCase } from './application/use-cases/update-store-settings/update-store-settings.use-case';
import { UploadStoreLogoUseCase } from './application/use-cases/upload-store-logo/upload-store-logo.use-case';
import { GetStoreLogoUseCase } from './application/use-cases/get-store-logo/get-store-logo.use-case';
import { DeleteStoreLogoUseCase } from './application/use-cases/delete-store-logo/delete-store-logo.use-case';
import { GetStoreWorkScheduleUseCase } from './application/use-cases/get-store-work-schedule/get-store-work-schedule.use-case';
import { ReplaceStoreWorkScheduleUseCase } from './application/use-cases/replace-store-work-schedule/replace-store-work-schedule.use-case';
import { StoreSettingsRepository } from './domain/repositories/store-settings.repository.interface';
import { PrismaStoreSettingsRepository } from './infrastructure/database/prisma-store-settings.repository';
import { GetStoreSettingsRoute } from './infrastructure/http/routes/get-store-settings/get-store-settings.route';
import { UpdateStoreSettingsRoute } from './infrastructure/http/routes/update-store-settings/update-store-settings.route';
import { StoreLogoRoute } from './infrastructure/http/routes/store-logo/store-logo.route';
import { StoreWorkScheduleRoute } from './infrastructure/http/routes/store-work-schedule/store-work-schedule.route';

@Module({
  controllers: [
    GetStoreSettingsRoute,
    UpdateStoreSettingsRoute,
    StoreLogoRoute,
    StoreWorkScheduleRoute,
  ],
  providers: [
    {
      provide: StoreSettingsRepository,
      useClass: PrismaStoreSettingsRepository,
    },
    GetStoreSettingsUseCase,
    UpdateStoreSettingsUseCase,
    UploadStoreLogoUseCase,
    GetStoreLogoUseCase,
    DeleteStoreLogoUseCase,
    GetStoreWorkScheduleUseCase,
    ReplaceStoreWorkScheduleUseCase,
  ],
  exports: [StoreSettingsRepository],
})
export class SettingsModule {}
