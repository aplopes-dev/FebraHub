import { Module } from '@nestjs/common';
import { CreateServiceRoute } from './infrastructure/http/routes/create-service/create-service.route';
import { ListServicesRoute } from './infrastructure/http/routes/list-services/list-services.route';
import { GetServiceByIdRoute } from './infrastructure/http/routes/get-service-by-id/get-service-by-id.route';
import { UpdateServiceRoute } from './infrastructure/http/routes/update-service/update-service.route';
import { ToggleServiceActiveRoute } from './infrastructure/http/routes/toggle-service-active/toggle-service-active.route';
import { DeleteServiceRoute } from './infrastructure/http/routes/delete-service/delete-service.route';

import { CreateServiceUseCase } from './application/use-cases/create-service/create-service.use-case';
import { ListServicesUseCase } from './application/use-cases/list-services/list-services.use-case';
import { GetServiceByIdUseCase } from './application/use-cases/get-service-by-id/get-service-by-id.use-case';
import { UpdateServiceUseCase } from './application/use-cases/update-service/update-service.use-case';
import { ToggleServiceActiveUseCase } from './application/use-cases/toggle-service-active/toggle-service-active.use-case';
import { DeleteServiceUseCase } from './application/use-cases/delete-service/delete-service.use-case';

import { PrismaServiceRepository } from './infrastructure/database/prisma-service.repository';
import { ServiceRepository } from './domain/repositories/service.repository.interface';

@Module({
  controllers: [
    CreateServiceRoute,
    ListServicesRoute,
    GetServiceByIdRoute,
    UpdateServiceRoute,
    ToggleServiceActiveRoute,
    DeleteServiceRoute,
  ],
  providers: [
    {
      provide: ServiceRepository,
      useClass: PrismaServiceRepository,
    },
    CreateServiceUseCase,
    ListServicesUseCase,
    GetServiceByIdUseCase,
    UpdateServiceUseCase,
    ToggleServiceActiveUseCase,
    DeleteServiceUseCase,
  ],
  exports: [ServiceRepository],
})
export class ServicesModule {}
