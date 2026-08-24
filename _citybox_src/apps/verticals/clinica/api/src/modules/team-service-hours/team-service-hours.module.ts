import { Module } from '@nestjs/common';
import { GetServiceHoursUseCase } from './application/get-service-hours.use-case';
import { UpsertServiceHoursUseCase } from './application/upsert-service-hours.use-case';
import { ProfessionalServiceHoursRepository } from './domain/professional-service-hours.repository';
import { GetServiceHoursRoute } from './infrastructure/http/get-service-hours.route';
import { UpsertServiceHoursRoute } from './infrastructure/http/upsert-service-hours.route';
import { PrismaProfessionalServiceHoursRepository } from './infrastructure/prisma-professional-service-hours.repository';

@Module({
  controllers: [GetServiceHoursRoute, UpsertServiceHoursRoute],
  providers: [
    {
      provide: ProfessionalServiceHoursRepository,
      useClass: PrismaProfessionalServiceHoursRepository,
    },
    GetServiceHoursUseCase,
    UpsertServiceHoursUseCase,
  ],
  exports: [ProfessionalServiceHoursRepository],
})
export class TeamServiceHoursModule {}
