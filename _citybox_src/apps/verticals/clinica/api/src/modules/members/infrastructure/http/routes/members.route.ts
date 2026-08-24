import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  DEFAULT_CLINIC_STRAND,
  resolveClinicStrand,
} from '@citybox/messaging';
import { CurrentUser } from '../../../../../shared/infra/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';
import { RequirePermission } from '../../../../../shared/infra/http/decorators/permissions';
import { SkipClinicScope } from '../../../../../shared/infra/http/decorators/skip-clinic-scope.decorator';
import { StoreId } from '../../../../../shared/infra/http/decorators/store-id.decorator';
import { CLINIC_ROLES, clinicRoleLabel } from '../../../domain/clinic-role.catalog';
import { CreateMemberUseCase } from '../../../application/use-cases/create-member.use-case';
import { GetMyAccessUseCase } from '../../../application/use-cases/get-my-access.use-case';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { OrganizationRepository } from '../../../../tenancy/domain/repositories/tenancy.repositories';
import { OrganizationNotFoundError } from '../../../../tenancy/domain/errors/tenancy.errors';
import { ManageMemberUseCase } from '../../../application/use-cases/manage-member.use-case';
import {
  CreateMemberBodyDto,
  SetMemberStatusBodyDto,
  UpdateMemberBodyDto,
} from './members.dto';
import { MembersPresenter } from './members.presenter';

@ApiTags('members')
@Controller('v1/members')
export class MembersRoute {
  constructor(
    private readonly getMyAccess: GetMyAccessUseCase,
    private readonly createMember: CreateMemberUseCase,
    private readonly members: MemberRepository,
    private readonly organizations: OrganizationRepository,
    private readonly manageMember: ManageMemberUseCase,
  ) {}

  /**
   * Contrato compartilhado entre verticais (ADR §7.1). O ERP chama isto em paralelo
   * para cada `vertical.<slug>.view` do JWT e agrega — sem passar pelo platform-api.
   * Não exige `X-Store-Id`: a pergunta é "onde ESTE usuário tem acesso".
   */
  @SkipClinicScope()
  @Get('me')
  @ApiOperation({ summary: 'Organizações e clínicas acessíveis ao usuário logado' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return MembersPresenter.myAccess(await this.getMyAccess.execute(user.sub));
  }

  @SkipClinicScope()
  @Get('roles')
  @ApiOperation({ summary: 'Catálogo de papéis da vertical clínica' })
  async roles(@Req() req: Request) {
    const raw = req.headers['x-store-id'] ?? req.headers['X-Store-Id'];
    const storeId = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    let strand = DEFAULT_CLINIC_STRAND;
    if (storeId) {
      const organization = await this.organizations.findByStoreId(storeId);
      if (organization?.clinicStrand) {
        strand = resolveClinicStrand(organization.clinicStrand);
      }
    }
    return {
      items: CLINIC_ROLES.map((r) => ({
        key: r.key,
        label: clinicRoleLabel(r.key, strand),
      })),
    };
  }

  @Get()
  @RequirePermission('read', 'Team')
  @ApiOperation({ summary: 'Equipe da organização' })
  async list(@StoreId() storeId: string) {
    const organization =
      (await this.organizations.findByClinicId(storeId)) ??
      (await this.organizations.findByStoreId(storeId));
    if (!organization) {
      throw new OrganizationNotFoundError(MembersRoute.name, storeId);
    }
    const items = await this.members.listByOrganization(organization.id);
    const platformStoreId = organization.storeId;
    return {
      items: items.map((member) =>
        MembersPresenter.one(member, organization.clinicStrand, platformStoreId),
      ),
    };
  }

  @Post()
  @RequirePermission('create', 'Team')
  @ApiOperation({ summary: 'Cria membro (Keycloak + vínculo por clínica)' })
  async create(@StoreId() storeId: string, @Body() body: CreateMemberBodyDto) {
    const result = await this.createMember.execute({ storeId, ...body });
    return MembersPresenter.created(result, storeId);
  }

  @Put(':memberId')
  @RequirePermission('update', 'Team')
  @ApiOperation({ summary: 'Edita membro e o escopo por clínica' })
  async update(
    @StoreId() storeId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateMemberBodyDto,
  ) {
    const organization = await this.organizations.findByStoreId(storeId);
    return MembersPresenter.one(
      await this.manageMember.update({ storeId, memberId, ...body }),
      organization?.clinicStrand,
      storeId,
    );
  }

  @Patch(':memberId/status')
  @RequirePermission('delete', 'Team')
  @ApiOperation({ summary: 'Ativa/desativa membro (reflete no Keycloak)' })
  async setStatus(
    @StoreId() storeId: string,
    @Param('memberId') memberId: string,
    @Body() body: SetMemberStatusBodyDto,
  ) {
    await this.manageMember.setStatus(storeId, memberId, body.status);
    return { ok: true };
  }

  @Post(':memberId/reset-password')
  @RequirePermission('update', 'Team')
  @ApiOperation({ summary: 'Gera nova senha provisória' })
  async resetPassword(
    @StoreId() storeId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.manageMember.resetPassword(storeId, memberId);
  }

  @Delete(':memberId')
  @RequirePermission('delete', 'Team')
  @ApiOperation({ summary: 'Remove membro (soft delete — preserva histórico clínico)' })
  async remove(
    @StoreId() storeId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.manageMember.remove(storeId, memberId);
    return { ok: true };
  }
}
