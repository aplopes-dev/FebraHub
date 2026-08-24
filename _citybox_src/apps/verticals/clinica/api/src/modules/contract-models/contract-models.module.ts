import { Module } from '@nestjs/common';

import { ListContractModelsRoute } from './infrastructure/http/routes/list-contract-models/list-contract-models.route';
import { CreateContractModelRoute } from './infrastructure/http/routes/create-contract-model/create-contract-model.route';
import { UpdateContractModelRoute } from './infrastructure/http/routes/update-contract-model/update-contract-model.route';
import { DeleteContractModelRoute } from './infrastructure/http/routes/delete-contract-model/delete-contract-model.route';
import { ListContractModelsUseCase } from './application/use-cases/list-contract-models/list-contract-models.use-case';
import { CreateContractModelUseCase } from './application/use-cases/create-contract-model/create-contract-model.use-case';
import { UpdateContractModelUseCase } from './application/use-cases/update-contract-model/update-contract-model.use-case';
import { DeleteContractModelUseCase } from './application/use-cases/delete-contract-model/delete-contract-model.use-case';
import { PrismaContractModelRepository } from './infrastructure/database/prisma-contract-model.repository';
import { ContractModelRepository } from './domain/repositories/contract-model.repository.interface';

@Module({
  controllers: [
    ListContractModelsRoute,
    CreateContractModelRoute,
    UpdateContractModelRoute,
    DeleteContractModelRoute,
  ],
  providers: [
    {
      provide: ContractModelRepository,
      useClass: PrismaContractModelRepository,
    },
    ListContractModelsUseCase,
    CreateContractModelUseCase,
    UpdateContractModelUseCase,
    DeleteContractModelUseCase,
  ],
  exports: [ContractModelRepository],
})
export class ContractModelsModule {}
