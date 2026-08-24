import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { FiscalGroupRepository } from './domain/repositories/fiscal-group.repository.interface';
import { FiscalDefaultTaxesRepository } from './domain/repositories/fiscal-default-taxes.repository.interface';
import { PrismaFiscalGroupRepository } from './infrastructure/database/prisma-fiscal-group.repository';
import { PrismaFiscalDefaultTaxesRepository } from './infrastructure/database/prisma-fiscal-default-taxes.repository';
import { ListFiscalGroupsUseCase } from './application/use-cases/list-fiscal-groups/list-fiscal-groups.use-case';
import { GetFiscalDefaultTaxesUseCase } from './application/use-cases/get-fiscal-default-taxes/get-fiscal-default-taxes.use-case';
import { UpsertFiscalDefaultTaxesUseCase } from './application/use-cases/upsert-fiscal-default-taxes/upsert-fiscal-default-taxes.use-case';
import { GetFiscalGroupUseCase } from './application/use-cases/get-fiscal-group/get-fiscal-group.use-case';
import { CreatePisCofinsGroupUseCase } from './application/use-cases/create-pis-cofins-group/create-pis-cofins-group.use-case';
import { UpdatePisCofinsGroupUseCase } from './application/use-cases/update-pis-cofins-group/update-pis-cofins-group.use-case';
import { ListProductsUsingGroupUseCase } from './application/use-cases/list-products-using-group/list-products-using-group.use-case';
import { ResolveItemPisCofinsUseCase } from './application/use-cases/resolve-item-pis-cofins/resolve-item-pis-cofins.use-case';
import { CreateIcmsGroupUseCase } from './application/use-cases/create-icms-group/create-icms-group.use-case';
import { UpdateIcmsGroupUseCase } from './application/use-cases/update-icms-group/update-icms-group.use-case';
import { ResolveItemIcmsUseCase } from './application/use-cases/resolve-item-icms/resolve-item-icms.use-case';
import { CreateIssqnGroupUseCase } from './application/use-cases/create-issqn-group/create-issqn-group.use-case';
import { UpdateIssqnGroupUseCase } from './application/use-cases/update-issqn-group/update-issqn-group.use-case';
import { ResolveServiceIssqnUseCase } from './application/use-cases/resolve-service-issqn/resolve-service-issqn.use-case';
import { CreateIpiGroupUseCase } from './application/use-cases/create-ipi-group/create-ipi-group.use-case';
import { UpdateIpiGroupUseCase } from './application/use-cases/update-ipi-group/update-ipi-group.use-case';
import { ResolveItemIpiUseCase } from './application/use-cases/resolve-item-ipi/resolve-item-ipi.use-case';
import { DeleteFiscalGroupUseCase } from './application/use-cases/delete-fiscal-group/delete-fiscal-group.use-case';
import { ListFiscalGroupsRoute } from './infrastructure/http/routes/list-fiscal-groups/list-fiscal-groups.route';
import { GetFiscalDefaultTaxesRoute } from './infrastructure/http/routes/get-fiscal-default-taxes/get-fiscal-default-taxes.route';
import { UpsertFiscalDefaultTaxesRoute } from './infrastructure/http/routes/upsert-fiscal-default-taxes/upsert-fiscal-default-taxes.route';
import { PisCofinsGroupRoute } from './infrastructure/http/routes/pis-cofins-group/pis-cofins-group.route';
import { IcmsGroupRoute } from './infrastructure/http/routes/icms-group/icms-group.route';
import { IssqnGroupRoute } from './infrastructure/http/routes/issqn-group/issqn-group.route';
import { IpiGroupRoute } from './infrastructure/http/routes/ipi-group/ipi-group.route';

/**
 * Padrões fiscais (spec erp/014) + grupos de PIS/COFINS (spec erp/015).
 * Base de 016/018/019.
 *
 * `FiscalGroup` começou somente-leitura (014) e ganhou CRUD para PIS/COFINS na
 * 015 (com CST + alíquotas). `ResolveItemPisCofinsUseCase` resolve produto →
 * grupo → padrão da org → fallback para a emissão (a fiscal-api recebe pronto).
 */
@Module({
  imports: [TenancyModule],
  controllers: [
    ListFiscalGroupsRoute,
    GetFiscalDefaultTaxesRoute,
    UpsertFiscalDefaultTaxesRoute,
    PisCofinsGroupRoute,
    IcmsGroupRoute,
    IssqnGroupRoute,
    IpiGroupRoute,
  ],
  providers: [
    {
      provide: FiscalGroupRepository,
      useClass: PrismaFiscalGroupRepository,
    },
    {
      provide: FiscalDefaultTaxesRepository,
      useClass: PrismaFiscalDefaultTaxesRepository,
    },
    ListFiscalGroupsUseCase,
    GetFiscalDefaultTaxesUseCase,
    UpsertFiscalDefaultTaxesUseCase,
    GetFiscalGroupUseCase,
    CreatePisCofinsGroupUseCase,
    UpdatePisCofinsGroupUseCase,
    ListProductsUsingGroupUseCase,
    ResolveItemPisCofinsUseCase,
    CreateIcmsGroupUseCase,
    UpdateIcmsGroupUseCase,
    ResolveItemIcmsUseCase,
    CreateIssqnGroupUseCase,
    UpdateIssqnGroupUseCase,
    ResolveServiceIssqnUseCase,
    CreateIpiGroupUseCase,
    UpdateIpiGroupUseCase,
    ResolveItemIpiUseCase,
    DeleteFiscalGroupUseCase,
  ],
  exports: [
    FiscalGroupRepository,
    FiscalDefaultTaxesRepository,
    ResolveItemPisCofinsUseCase,
    ResolveItemIcmsUseCase,
    ResolveServiceIssqnUseCase,
    ResolveItemIpiUseCase,
  ],
})
export class FiscalDefaultsModule {}
