import { Module } from '@nestjs/common';
import { KeycloakProvisioningService } from '../../shared/infra/keycloak/keycloak-provisioning.service';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CreateMemberUseCase } from './application/use-cases/create-member.use-case';
import { ManageMemberUseCase } from './application/use-cases/manage-member.use-case';
import { GetMyAccessUseCase } from './application/use-cases/get-my-access.use-case';
import { ProvisionOrganizationOwnerUseCase } from './application/use-cases/provision-organization-owner.use-case';
import { MemberRepository } from './domain/repositories/member.repository';
import { PrismaMemberRepository } from './infrastructure/database/prisma-member.repository';
import { ResolveProfessionalCouncilService } from './application/services/resolve-professional-council.service';
import { MembersRoute } from './infrastructure/http/routes/members.route';

/**
 * Equipe da clínica. Até a Fase 4 isto vivia no platform-api (`store_members`) e a
 * clínica só guardava ids soltos.
 *
 * `KeycloakProvisioningService` é **local a esta API** (ADR C-17): fala com o realm
 * `citybox-clinica` usando a credencial `clinica-provisioning`, que tem `manage-users`
 * só neste realm.
 */
@Module({
  imports: [TenancyModule],
  controllers: [MembersRoute],
  providers: [
    { provide: MemberRepository, useClass: PrismaMemberRepository },
    {
      provide: KeycloakProvisioningService,
      useFactory: () =>
        new KeycloakProvisioningService({
          issuer: process.env.KEYCLOAK_ISSUER ?? '',
          clientId: process.env.KEYCLOAK_PROVISIONING_CLIENT_ID ?? '',
          clientSecret: process.env.KEYCLOAK_PROVISIONING_CLIENT_SECRET ?? '',
        }),
    },
    GetMyAccessUseCase,
    CreateMemberUseCase,
    ManageMemberUseCase,
    ProvisionOrganizationOwnerUseCase,
    ResolveProfessionalCouncilService,
  ],
  // `ProvisionOrganizationOwnerUseCase` é exportado para o `store-setup`: o responsável
  // nasce no seed da loja, mas a regra de equipe continua sendo deste módulo.
  // `ResolveProfessionalCouncilService` alimenta a 1ª emissão de receituário/atestado.
  exports: [
    MemberRepository,
    ProvisionOrganizationOwnerUseCase,
    ManageMemberUseCase,
    ResolveProfessionalCouncilService,
  ],
})
export class MembersModule {}
