import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { KeycloakProvisioningService } from '../../shared/infra/keycloak/keycloak-provisioning.service';
import { SeedFinancialDefaultsService } from './application/seed-financial-defaults';
import { CreateMemberUseCase } from './application/use-cases/create-member/create-member.use-case';
import { EnsurePlatformStoreOwnerUseCase } from './application/use-cases/ensure-platform-store-owner/ensure-platform-store-owner.use-case';
import { GetMyAccessUseCase } from './application/use-cases/get-my-access/get-my-access.use-case';
import { FindPlatformStoreOwnerUseCase } from './application/use-cases/find-platform-store-owner/find-platform-store-owner.use-case';
import { ProvisionPlatformStoreUseCase } from './application/use-cases/provision-platform-store/provision-platform-store.use-case';
import { ResetPlatformStoreOwnerPasswordUseCase } from './application/use-cases/reset-platform-store-owner-password/reset-platform-store-owner-password.use-case';
import { ResetMemberPasswordUseCase } from './application/use-cases/reset-member-password/reset-member-password.use-case';
import { ListMembersUseCase } from './application/use-cases/list-members/list-members.use-case';
import { GetMemberByIdUseCase } from './application/use-cases/get-member-by-id/get-member-by-id.use-case';
import { UpdateMemberUseCase } from './application/use-cases/update-member/update-member.use-case';
import { GetMemberWorkScheduleUseCase } from './application/use-cases/get-member-work-schedule/get-member-work-schedule.use-case';
import { ReplaceMemberWorkScheduleUseCase } from './application/use-cases/replace-member-work-schedule/replace-member-work-schedule.use-case';
import { ListMemberWorkSchedulesUseCase } from './application/use-cases/list-member-work-schedules/list-member-work-schedules.use-case';
import { IdentityProvider } from './domain/providers/identity-provider.interface';
import { MemberRepository } from './domain/repositories/member.repository';
import {
  OrganizationRepository,
  StoreRepository,
} from './domain/repositories/tenancy.repositories';
import { PrismaMemberRepository } from './infrastructure/database/prisma-member.repository';
import {
  PrismaOrganizationRepository,
  PrismaStoreRepository,
} from './infrastructure/database/prisma-tenancy.repository';
import { KeycloakIdentityAdapter } from './infrastructure/keycloak/keycloak-identity.adapter';
import { MembersRoute } from './infrastructure/http/routes/members.route';
import { FindPlatformStoreOwnerRoute } from './infrastructure/http/routes/find-platform-store-owner/find-platform-store-owner.route';
import { ProvisionPlatformStoreRoute } from './infrastructure/http/routes/provision-platform-store/provision-platform-store.route';
import { ResetPlatformStoreOwnerPasswordRoute } from './infrastructure/http/routes/reset-platform-store-owner-password/reset-platform-store-owner-password.route';
import { EventDedupeService } from './infrastructure/messaging/event-dedupe.service';
import { StorePlatformConsumer } from './infrastructure/messaging/consumers/store-platform.consumer';

/**
 * Tenancy: Organization + Store + Member + identidade.
 *
 * Consolida os antigos `members` e `store-setup` num módulo só, como no ERP
 * (ADR C-17, bloco 7). O Keycloak entra **apenas** por `IdentityProvider` —
 * o `KeycloakProvisioningService` é detalhe do adapter e não é exportado.
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    MembersRoute,
    FindPlatformStoreOwnerRoute,
    ProvisionPlatformStoreRoute,
    ResetPlatformStoreOwnerPasswordRoute,
  ],
  providers: [
    { provide: MemberRepository, useClass: PrismaMemberRepository },
    { provide: OrganizationRepository, useClass: PrismaOrganizationRepository },
    { provide: StoreRepository, useClass: PrismaStoreRepository },
    {
      provide: KeycloakProvisioningService,
      useFactory: () =>
        new KeycloakProvisioningService({
          issuer: process.env.KEYCLOAK_ISSUER ?? '',
          clientId: process.env.KEYCLOAK_PROVISIONING_CLIENT_ID ?? '',
          clientSecret: process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET ?? '',
        }),
    },
    { provide: IdentityProvider, useClass: KeycloakIdentityAdapter },
    EventDedupeService,
    SeedFinancialDefaultsService,
    GetMyAccessUseCase,
    CreateMemberUseCase,
    ListMembersUseCase,
    GetMemberByIdUseCase,
    UpdateMemberUseCase,
    GetMemberWorkScheduleUseCase,
    ReplaceMemberWorkScheduleUseCase,
    ListMemberWorkSchedulesUseCase,
    FindPlatformStoreOwnerUseCase,
    ResetPlatformStoreOwnerPasswordUseCase,
    ResetMemberPasswordUseCase,
    EnsurePlatformStoreOwnerUseCase,
    ProvisionPlatformStoreUseCase,
    StorePlatformConsumer,
  ],
  exports: [
    MemberRepository,
    OrganizationRepository,
    StoreRepository,
    IdentityProvider,
    ResetPlatformStoreOwnerPasswordUseCase,
  ],
})
export class TenancyModule {}
