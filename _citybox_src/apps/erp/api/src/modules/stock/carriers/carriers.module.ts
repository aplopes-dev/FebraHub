import { Module } from '@nestjs/common';

import { TenancyModule } from '../../tenancy/tenancy.module';

import { CarrierRepository } from './domain/repositories/carrier.repository.interface';
import { PrismaCarrierRepository } from './infrastructure/database/prisma-carrier.repository';

import { CreateCarrierUseCase } from './application/use-cases/create-carrier/create-carrier.use-case';
import { ListCarriersUseCase } from './application/use-cases/list-carriers/list-carriers.use-case';
import { FindCarrierByIdUseCase } from './application/use-cases/find-carrier-by-id/find-carrier-by-id.use-case';
import { UpdateCarrierUseCase } from './application/use-cases/update-carrier/update-carrier.use-case';
import { DeleteCarrierUseCase } from './application/use-cases/delete-carrier/delete-carrier.use-case';
import { RestoreCarrierUseCase } from './application/use-cases/restore-carrier/restore-carrier.use-case';

import { CreateCarrierRoute } from './infrastructure/http/routes/create-carrier/create-carrier.route';
import { ListCarriersRoute } from './infrastructure/http/routes/list-carriers/list-carriers.route';
import { FindCarrierByIdRoute } from './infrastructure/http/routes/find-carrier-by-id/find-carrier-by-id.route';
import { UpdateCarrierRoute } from './infrastructure/http/routes/update-carrier/update-carrier.route';
import { DeleteCarrierRoute } from './infrastructure/http/routes/delete-carrier/delete-carrier.route';
import { RestoreCarrierRoute } from './infrastructure/http/routes/restore-carrier/restore-carrier.route';

/**
 * Cadastro de transportadoras da organização.
 *
 * Importa a `TenancyModule` pelo `BranchRepository`: criar e atualizar
 * conferem que cada unidade atendida é mesmo da organização ativa.
 */
@Module({
  imports: [TenancyModule],
  // Ordem importa: as rotas de caminho fixo antes de `:id`, para o Nest não
  // tratar um segmento fixo como parâmetro.
  controllers: [
    ListCarriersRoute,
    CreateCarrierRoute,
    RestoreCarrierRoute,
    FindCarrierByIdRoute,
    UpdateCarrierRoute,
    DeleteCarrierRoute,
  ],
  providers: [
    { provide: CarrierRepository, useClass: PrismaCarrierRepository },
    CreateCarrierUseCase,
    ListCarriersUseCase,
    FindCarrierByIdUseCase,
    UpdateCarrierUseCase,
    DeleteCarrierUseCase,
    RestoreCarrierUseCase,
  ],
  exports: [CarrierRepository],
})
export class CarriersModule {}
