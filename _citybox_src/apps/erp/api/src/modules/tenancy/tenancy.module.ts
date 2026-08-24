import { Module } from '@nestjs/common';

import { KeycloakAdminService } from '../../shared/infra/keycloak/keycloak-admin.service';
import { StoreSetupModule } from '../store-setup/store-setup.module';

import { OrganizationRepository } from './domain/repositories/organization.repository.interface';
import { BranchRepository } from './domain/repositories/branch.repository.interface';
import { MembershipRepository } from './domain/repositories/membership.repository.interface';
import { PermissionProfileRepository } from './domain/repositories/permission-profile.repository.interface';
import { UserRepository } from './domain/repositories/user.repository.interface';
import { IdentityProvider } from './domain/providers/identity-provider.interface';

import { PrismaOrganizationRepository } from './infrastructure/database/prisma-organization.repository';
import { PrismaBranchRepository } from './infrastructure/database/prisma-branch.repository';
import { PrismaMembershipRepository } from './infrastructure/database/prisma-membership.repository';
import { PrismaPermissionProfileRepository } from './infrastructure/database/prisma-permission-profile.repository';
import { PrismaUserRepository } from './infrastructure/database/prisma-user.repository';
import { KeycloakIdentityAdapter } from './infrastructure/keycloak/keycloak-identity.adapter';
import { EventDedupeService } from './infrastructure/messaging/event-dedupe.service';
import { StorePlatformConsumer } from './infrastructure/messaging/consumers/store-platform.consumer';

import { CreateOrganizationUseCase } from './application/use-cases/create-organization/create-organization.use-case';
import { ListMyOrganizationsUseCase } from './application/use-cases/list-my-organizations/list-my-organizations.use-case';
import { FindOrganizationByIdUseCase } from './application/use-cases/find-organization-by-id/find-organization-by-id.use-case';
import { UpdateOrganizationUseCase } from './application/use-cases/update-organization/update-organization.use-case';
import { CreateBranchUseCase } from './application/use-cases/create-branch/create-branch.use-case';
import { ListBranchesUseCase } from './application/use-cases/list-branches/list-branches.use-case';
import { FindBranchByIdUseCase } from './application/use-cases/find-branch-by-id/find-branch-by-id.use-case';
import { UpdateBranchUseCase } from './application/use-cases/update-branch/update-branch.use-case';
import { DeleteBranchUseCase } from './application/use-cases/delete-branch/delete-branch.use-case';
import { CreateMemberUseCase } from './application/use-cases/create-member/create-member.use-case';
import { ListMembersUseCase } from './application/use-cases/list-members/list-members.use-case';
import { UpdateMemberUseCase } from './application/use-cases/update-member/update-member.use-case';
import { RemoveMemberUseCase } from './application/use-cases/remove-member/remove-member.use-case';
import { ResetMemberPasswordUseCase } from './application/use-cases/reset-member-password/reset-member-password.use-case';
import { SetMemberPdvPinUseCase } from './application/use-cases/set-member-pdv-pin/set-member-pdv-pin.use-case';
import { SyncOrganizationFromStoreUseCase } from './application/use-cases/sync-organization-from-store/sync-organization-from-store.use-case';
import { FindPlatformStoreOwnerUseCase } from './application/use-cases/find-platform-store-owner/find-platform-store-owner.use-case';
import { ResetPlatformStoreOwnerPasswordUseCase } from './application/use-cases/reset-platform-store-owner-password/reset-platform-store-owner-password.use-case';
import { ProvisionPlatformStoreUseCase } from './application/use-cases/provision-platform-store/provision-platform-store.use-case';
import { ListPermissionProfilesUseCase } from './application/use-cases/list-permission-profiles/list-permission-profiles.use-case';
import { FindPermissionProfileByIdUseCase } from './application/use-cases/find-permission-profile-by-id/find-permission-profile-by-id.use-case';
import { CreatePermissionProfileUseCase } from './application/use-cases/create-permission-profile/create-permission-profile.use-case';
import { UpdatePermissionProfileUseCase } from './application/use-cases/update-permission-profile/update-permission-profile.use-case';
import { DeletePermissionProfileUseCase } from './application/use-cases/delete-permission-profile/delete-permission-profile.use-case';
import { RestorePermissionProfileUseCase } from './application/use-cases/restore-permission-profile/restore-permission-profile.use-case';

import { CreateOrganizationRoute } from './infrastructure/http/routes/create-organization/create-organization.route';
import { ListMyOrganizationsRoute } from './infrastructure/http/routes/list-my-organizations/list-my-organizations.route';
import { FindCurrentOrganizationRoute } from './infrastructure/http/routes/find-current-organization/find-current-organization.route';
import { UpdateOrganizationRoute } from './infrastructure/http/routes/update-organization/update-organization.route';
import { CreateBranchRoute } from './infrastructure/http/routes/create-branch/create-branch.route';
import { ListBranchesRoute } from './infrastructure/http/routes/list-branches/list-branches.route';
import { FindBranchByIdRoute } from './infrastructure/http/routes/find-branch-by-id/find-branch-by-id.route';
import { UpdateBranchRoute } from './infrastructure/http/routes/update-branch/update-branch.route';
import { DeleteBranchRoute } from './infrastructure/http/routes/delete-branch/delete-branch.route';
import { CreateMemberRoute } from './infrastructure/http/routes/create-member/create-member.route';
import { ListMembersRoute } from './infrastructure/http/routes/list-members/list-members.route';
import { UpdateMemberRoute } from './infrastructure/http/routes/update-member/update-member.route';
import { RemoveMemberRoute } from './infrastructure/http/routes/remove-member/remove-member.route';
import { ResetMemberPasswordRoute } from './infrastructure/http/routes/reset-member-password/reset-member-password.route';
import { SetMemberPdvPinRoute } from './infrastructure/http/routes/set-member-pdv-pin/set-member-pdv-pin.route';
import { FindPlatformStoreOwnerRoute } from './infrastructure/http/routes/find-platform-store-owner/find-platform-store-owner.route';
import { ResetPlatformStoreOwnerPasswordRoute } from './infrastructure/http/routes/reset-platform-store-owner-password/reset-platform-store-owner-password.route';
import { ProvisionPlatformStoreRoute } from './infrastructure/http/routes/provision-platform-store/provision-platform-store.route';
import { ListPermissionProfilesRoute } from './infrastructure/http/routes/list-permission-profiles/list-permission-profiles.route';
import { FindPermissionProfileByIdRoute } from './infrastructure/http/routes/find-permission-profile-by-id/find-permission-profile-by-id.route';
import { CreatePermissionProfileRoute } from './infrastructure/http/routes/create-permission-profile/create-permission-profile.route';
import { UpdatePermissionProfileRoute } from './infrastructure/http/routes/update-permission-profile/update-permission-profile.route';
import { DeletePermissionProfileRoute } from './infrastructure/http/routes/delete-permission-profile/delete-permission-profile.route';
import { RestorePermissionProfileRoute } from './infrastructure/http/routes/restore-permission-profile/restore-permission-profile.route';
import { PermissionCatalogRoute } from './infrastructure/http/routes/permission-catalog/permission-catalog.route';

/**
 * Módulo base da arquitetura multi-empresa: organizações, unidades e quem pode
 * operar onde.
 *
 * Exporta os repositórios porque o `TenantContextGuard` e os módulos de
 * negócio precisam resolver vínculo e acesso — mas nunca as implementações
 * Prisma, só as interfaces.
 */
@Module({
  imports: [StoreSetupModule],
  // Ordem importa: rotas fixas (`current`, `restore`, `permission-catalog`)
  // antes das de caminho variável, para o Nest não tratar o segmento como id.
  controllers: [
    FindCurrentOrganizationRoute,
    UpdateOrganizationRoute,
    CreateOrganizationRoute,
    ListMyOrganizationsRoute,
    CreateBranchRoute,
    ListBranchesRoute,
    UpdateBranchRoute,
    DeleteBranchRoute,
    FindBranchByIdRoute,
    CreateMemberRoute,
    ListMembersRoute,
    ResetMemberPasswordRoute,
    SetMemberPdvPinRoute,
    UpdateMemberRoute,
    RemoveMemberRoute,
    FindPlatformStoreOwnerRoute,
    ResetPlatformStoreOwnerPasswordRoute,
    ProvisionPlatformStoreRoute,
    PermissionCatalogRoute,
    ListPermissionProfilesRoute,
    CreatePermissionProfileRoute,
    RestorePermissionProfileRoute,
    UpdatePermissionProfileRoute,
    DeletePermissionProfileRoute,
    FindPermissionProfileByIdRoute,
  ],
  providers: [
    KeycloakAdminService,
    { provide: OrganizationRepository, useClass: PrismaOrganizationRepository },
    { provide: BranchRepository, useClass: PrismaBranchRepository },
    { provide: MembershipRepository, useClass: PrismaMembershipRepository },
    {
      provide: PermissionProfileRepository,
      useClass: PrismaPermissionProfileRepository,
    },
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: IdentityProvider, useClass: KeycloakIdentityAdapter },
    CreateOrganizationUseCase,
    ListMyOrganizationsUseCase,
    FindOrganizationByIdUseCase,
    UpdateOrganizationUseCase,
    CreateBranchUseCase,
    ListBranchesUseCase,
    FindBranchByIdUseCase,
    UpdateBranchUseCase,
    DeleteBranchUseCase,
    CreateMemberUseCase,
    ListMembersUseCase,
    UpdateMemberUseCase,
    RemoveMemberUseCase,
    ResetMemberPasswordUseCase,
    SetMemberPdvPinUseCase,
    FindPlatformStoreOwnerUseCase,
    ResetPlatformStoreOwnerPasswordUseCase,
    ProvisionPlatformStoreUseCase,
    ListPermissionProfilesUseCase,
    FindPermissionProfileByIdUseCase,
    CreatePermissionProfileUseCase,
    UpdatePermissionProfileUseCase,
    DeletePermissionProfileUseCase,
    RestorePermissionProfileUseCase,
    SyncOrganizationFromStoreUseCase,
    EventDedupeService,
    StorePlatformConsumer,
  ],
  exports: [
    OrganizationRepository,
    BranchRepository,
    MembershipRepository,
    PermissionProfileRepository,
    UserRepository,
  ],
})
export class TenancyModule {}
