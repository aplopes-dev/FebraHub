import { Module } from '@nestjs/common';
import { KeycloakProvisioningService } from '../../shared/infra/keycloak/keycloak-provisioning.service';
import { MembersModule } from '../members/members.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { SyncOrganizationFromEventUseCase } from '../tenancy/application/use-cases/sync-organization-from-event.use-case';
import { EventDedupeService } from './infrastructure/messaging/event-dedupe.service';
import { ClinicStorePersistenceModule } from './clinic-store-persistence.module';
import { StoreSetupLogRepository } from './domain/repositories/store-setup-log.repository.interface';
import { PrismaStoreSetupLogRepository } from './infrastructure/database/prisma-store-setup-log.repository';
import { ClinicStoreSeeder } from './application/clinic-store-seeder';
import { UpsertClinicStoreUseCase } from './application/use-cases/upsert-clinic-store/upsert-clinic-store.use-case';
import { SetupInitialStoreUseCase } from './application/use-cases/setup-initial-store/setup-initial-store.use-case';
import { RetryStoreSetupUseCase } from './application/use-cases/retry-store-setup/retry-store-setup.use-case';
import { ProvisionPlatformStoreUseCase } from './application/use-cases/provision-platform-store/provision-platform-store.use-case';
import { RetryStoreSetupRoute } from './infrastructure/http/routes/retry-store-setup/retry-store-setup.route';
import { ProvisionPlatformStoreRoute } from './infrastructure/http/routes/provision-platform-store/provision-platform-store.route';

@Module({
  imports: [TenancyModule, ClinicStorePersistenceModule, MembersModule],
  controllers: [RetryStoreSetupRoute, ProvisionPlatformStoreRoute],
  providers: [
    {
      provide: StoreSetupLogRepository,
      useClass: PrismaStoreSetupLogRepository,
    },
    ClinicStoreSeeder,
    EventDedupeService,
    SyncOrganizationFromEventUseCase,
    {
      provide: KeycloakProvisioningService,
      useFactory: () =>
        new KeycloakProvisioningService({
          issuer: process.env.KEYCLOAK_ISSUER ?? '',
          clientId: process.env.KEYCLOAK_PROVISIONING_CLIENT_ID ?? '',
          clientSecret: process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET ?? '',
        }),
    },
    UpsertClinicStoreUseCase,
    SetupInitialStoreUseCase,
    RetryStoreSetupUseCase,
    ProvisionPlatformStoreUseCase,
  ],
  exports: [EventDedupeService, SyncOrganizationFromEventUseCase, 
    ClinicStorePersistenceModule,
    UpsertClinicStoreUseCase,
    SetupInitialStoreUseCase,
  ],
})
export class StoreSetupModule {}
