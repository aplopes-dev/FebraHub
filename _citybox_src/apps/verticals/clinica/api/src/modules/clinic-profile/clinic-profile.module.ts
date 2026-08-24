import { Module } from '@nestjs/common';
import { ClinicStoreProfileRepository } from './domain/repositories/clinic-store-profile.repository.interface';
import { PrismaClinicStoreProfileRepository } from './infrastructure/database/prisma-clinic-store-profile.repository';
import { GetClinicProfileRoute } from './infrastructure/http/routes/get-clinic-profile/get-clinic-profile.route';
import { UpsertClinicProfileRoute } from './infrastructure/http/routes/upsert-clinic-profile/upsert-clinic-profile.route';
import { ClinicLogoRoute } from './infrastructure/http/routes/clinic-logo/clinic-logo.route';
import { GetClinicProfileUseCase } from './application/use-cases/get-clinic-profile/get-clinic-profile.use-case';
import { UpsertClinicProfileUseCase } from './application/use-cases/upsert-clinic-profile/upsert-clinic-profile.use-case';
import { UploadClinicLogoUseCase } from './application/use-cases/upload-clinic-logo/upload-clinic-logo.use-case';
import { GetClinicLogoUseCase } from './application/use-cases/get-clinic-logo/get-clinic-logo.use-case';
import { DeleteClinicLogoUseCase } from './application/use-cases/delete-clinic-logo/delete-clinic-logo.use-case';

@Module({
  controllers: [
    GetClinicProfileRoute,
    UpsertClinicProfileRoute,
    ClinicLogoRoute,
  ],
  providers: [
    {
      provide: ClinicStoreProfileRepository,
      useClass: PrismaClinicStoreProfileRepository,
    },
    GetClinicProfileUseCase,
    UpsertClinicProfileUseCase,
    UploadClinicLogoUseCase,
    GetClinicLogoUseCase,
    DeleteClinicLogoUseCase,
  ],
  exports: [ClinicStoreProfileRepository],
})
export class ClinicProfileModule {}
