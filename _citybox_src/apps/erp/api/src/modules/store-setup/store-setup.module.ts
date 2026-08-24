import { Module } from '@nestjs/common';
import { StoreSetupRepository } from './domain/repositories/store-setup.repository.interface';
import { PrismaStoreSetupRepository } from './infrastructure/database/prisma-store-setup.repository';
import { ProvisionOrganizationDataUseCase } from './application/use-cases/provision-organization-data/provision-organization-data.use-case';

/**
 * Dados de sistema de uma organização — o que precisa existir para o ERP funcionar.
 *
 * Exporta o use case porque quem provisiona são outros módulos: o consumidor de
 * `citybox.store.created` e a criação de organização pela API.
 */
@Module({
  providers: [
    { provide: StoreSetupRepository, useClass: PrismaStoreSetupRepository },
    ProvisionOrganizationDataUseCase,
  ],
  exports: [ProvisionOrganizationDataUseCase],
})
export class StoreSetupModule {}
