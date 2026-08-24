import { VerticalMemberProvisioning } from './domain/providers/vertical-member-provisioning.provider';
import { HttpVerticalMemberProvisioning } from './infrastructure/providers/http-vertical-member-provisioning.adapter';
import { VerticalMembersRoute } from './infrastructure/http/routes/vertical-members/vertical-members.route';
import { SignaturePackageProvisioning } from './domain/providers/signature-package-provisioning.provider';
import { HttpSignaturePackageProvisioning } from './infrastructure/providers/http-signature-package-provisioning.adapter';
import { SignaturePackageRequestsRoute } from './infrastructure/http/routes/signature-package-requests/signature-package-requests.route';
import { Module, forwardRef } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { PlansModule } from '../plans/plans.module';
import { ListStoresRoute } from './infrastructure/http/routes/list-stores/list-stores.route';
import { FindStoreByIdRoute } from './infrastructure/http/routes/find-store-by-id/find-store-by-id.route';
import { CreateStoreRoute } from './infrastructure/http/routes/create-store/create-store.route';
import { ProvisionStoreRoute } from './infrastructure/http/routes/provision-store/provision-store.route';
import { UpdateStoreRoute } from './infrastructure/http/routes/update-store/update-store.route';
import { BlockStoreRoute } from './infrastructure/http/routes/block-store/block-store.route';
import { ChangeStorePlanRoute } from './infrastructure/http/routes/change-store-plan/change-store-plan.route';
import { UpdateStoreSettingsRoute } from './infrastructure/http/routes/update-store-settings/update-store-settings.route';
import { UpdateStoreModuleRoute } from './infrastructure/http/routes/update-store-module/update-store-module.route';
import { ManageStoreMembersRoute } from './infrastructure/http/routes/manage-store-members/manage-store-members.route';
import { BackofficeStoreTeamRoute } from './infrastructure/http/routes/backoffice-store-team/backoffice-store-team.route';
import { ListStoreAuditLogRoute } from './infrastructure/http/routes/list-store-audit-log/list-store-audit-log.route';
import { ListStoresUseCase } from './application/use-cases/list-stores/list-stores.use-case';
import { FindStoreByIdUseCase } from './application/use-cases/find-store-by-id/find-store-by-id.use-case';
import { CreateStoreUseCase } from './application/use-cases/create-store/create-store.use-case';
import { ProvisionStoreUseCase } from './application/use-cases/provision-store/provision-store.use-case';
import { UpdateStoreUseCase } from './application/use-cases/update-store/update-store.use-case';
import { BlockStoreUseCase } from './application/use-cases/block-store/block-store.use-case';
import { ChangeStorePlanUseCase } from './application/use-cases/change-store-plan/change-store-plan.use-case';
import { UnblockStoreUseCase } from './application/use-cases/unblock-store/unblock-store.use-case';
import { UpdateStoreSettingsUseCase } from './application/use-cases/update-store-settings/update-store-settings.use-case';
import { UpdateStoreModuleUseCase } from './application/use-cases/update-store-module/update-store-module.use-case';
import {
  DeleteStoreMemberUseCase,
  UpsertStoreMemberUseCase,
} from './application/use-cases/manage-store-members/manage-store-members.use-case';
import { ResetStoreMemberPasswordUseCase } from './application/use-cases/reset-store-member-password/reset-store-member-password.use-case';
import { SendStoreMemberPasswordLinkUseCase } from './application/use-cases/send-store-member-password-link/send-store-member-password-link.use-case';
import { ListStoreAuditLogUseCase } from './application/use-cases/list-store-audit-log/list-store-audit-log.use-case';
import { ListStoreMemberRolesUseCase } from './application/use-cases/list-store-member-roles/list-store-member-roles.use-case';
import { ListStoreMembersUseCase } from './application/use-cases/list-store-members/list-store-members.use-case';
import { UpdateStoreMemberStatusUseCase } from './application/use-cases/update-store-member-status/update-store-member-status.use-case';
import { ListStoreSignaturePackageRequestsUseCase } from './application/use-cases/list-store-signature-package-requests/list-store-signature-package-requests.use-case';
import { LiberateStoreSignaturePackageRequestUseCase } from './application/use-cases/liberate-store-signature-package-request/liberate-store-signature-package-request.use-case';
import { CancelStoreSignaturePackageRequestUseCase } from './application/use-cases/cancel-store-signature-package-request/cancel-store-signature-package-request.use-case';
import { StoreMembershipGuard } from '../../shared/infra/http/guards/store-membership.guard';
import { PrismaStoreRepository } from './infrastructure/database/prisma-store.repository';
import { PrismaStoreDetailRepository } from './infrastructure/database/prisma-store-detail.repository';
import { StoreRepository } from './domain/repositories/store.repository.interface';
import { StoreDetailRepository } from './domain/repositories/store-detail.repository.interface';
import { KeycloakAdminService } from '../../shared/infra/keycloak/keycloak-admin.service';
import { SeedClinicDemoTeamUseCase } from './application/use-cases/seed-clinic-demo-team/seed-clinic-demo-team.use-case';
import { SeedClinicDemoTeamRoute } from './infrastructure/http/routes/seed-clinic-demo-team/seed-clinic-demo-team.route';

@Module({
  imports: [SubscriptionsModule, forwardRef(() => InvoicesModule), PlansModule],
  controllers: [
    VerticalMembersRoute,
    SignaturePackageRequestsRoute,
    ListStoresRoute,
    CreateStoreRoute,
    ProvisionStoreRoute,
    BlockStoreRoute,
    ChangeStorePlanRoute,
    FindStoreByIdRoute,
    UpdateStoreRoute,
    UpdateStoreSettingsRoute,
    UpdateStoreModuleRoute,
    ManageStoreMembersRoute,
    BackofficeStoreTeamRoute,
    ListStoreAuditLogRoute,
    SeedClinicDemoTeamRoute,
  ],
  providers: [
    {
      provide: VerticalMemberProvisioning,
      useClass: HttpVerticalMemberProvisioning,
    },
    {
      provide: SignaturePackageProvisioning,
      useClass: HttpSignaturePackageProvisioning,
    },
    { provide: StoreRepository, useClass: PrismaStoreRepository },
    { provide: StoreDetailRepository, useClass: PrismaStoreDetailRepository },
    ListStoresUseCase,
    FindStoreByIdUseCase,
    CreateStoreUseCase,
    ProvisionStoreUseCase,
    UpdateStoreUseCase,
    BlockStoreUseCase,
    UnblockStoreUseCase,
    ChangeStorePlanUseCase,
    UpdateStoreSettingsUseCase,
    UpdateStoreModuleUseCase,
    UpsertStoreMemberUseCase,
    DeleteStoreMemberUseCase,
    ResetStoreMemberPasswordUseCase,
    SendStoreMemberPasswordLinkUseCase,
    ListStoreMemberRolesUseCase,
    ListStoreMembersUseCase,
    UpdateStoreMemberStatusUseCase,
    ListStoreAuditLogUseCase,
    ListStoreSignaturePackageRequestsUseCase,
    LiberateStoreSignaturePackageRequestUseCase,
    CancelStoreSignaturePackageRequestUseCase,
    StoreMembershipGuard,
    KeycloakAdminService,
    SeedClinicDemoTeamUseCase,
  ],
  exports: [
    StoreRepository,
    StoreDetailRepository,
    KeycloakAdminService,
    BlockStoreUseCase,
    UnblockStoreUseCase,
  ],
})
export class StoresModule {}
