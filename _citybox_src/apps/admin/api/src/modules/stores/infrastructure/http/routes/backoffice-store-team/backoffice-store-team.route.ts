import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DeleteStoreMemberUseCase,
  UpsertStoreMemberUseCase,
} from '../../../../application/use-cases/manage-store-members/manage-store-members.use-case';
import { ListStoreMemberRolesUseCase } from '../../../../application/use-cases/list-store-member-roles/list-store-member-roles.use-case';
import { ListStoreMembersUseCase } from '../../../../application/use-cases/list-store-members/list-store-members.use-case';
import { ResetStoreMemberPasswordUseCase } from '../../../../application/use-cases/reset-store-member-password/reset-store-member-password.use-case';
import { UpdateStoreMemberStatusUseCase } from '../../../../application/use-cases/update-store-member-status/update-store-member-status.use-case';
import { StoreRepository } from '../../../../domain/repositories/store.repository.interface';
import type { StoreMemberRow } from '../../../../domain/repositories/store-detail.repository.interface';
import { getRoleCatalogItem } from '../../../../domain/catalog/store-role.catalog';
import { StoreNotFoundError } from '../../../../domain/errors/store-not-found.error';
import { StoreMembershipGuard } from '../../../../../../shared/infra/http/guards/store-membership.guard';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';
import {
  UpsertStoreMemberBodyDto,
  UpdateStoreMemberStatusBodyDto,
} from '../shared/store-detail.dto';
import { deriveStoreMemberStatus } from '../../../../application/utils/store-member-status';

/**
 * Gestão de equipe acionada pelo próprio lojista no ERP (store-scoped).
 * Diferente do `ManageStoreMembersRoute` (admin/`platform.admin`), aqui o
 * acesso é liberado pelo `StoreMembershipGuard` a qualquer membro da loja.
 * Reaproveita os mesmos use cases e o fluxo Keycloak.
 */
@ApiTags('stores')
@Controller('v1/backoffice/stores')
@UseGuards(StoreMembershipGuard)
export class BackofficeStoreTeamRoute {
  constructor(
    private readonly listStoreMembers: ListStoreMembersUseCase,
    private readonly listStoreMemberRoles: ListStoreMemberRolesUseCase,
    private readonly upsertStoreMember: UpsertStoreMemberUseCase,
    private readonly deleteStoreMember: DeleteStoreMemberUseCase,
    private readonly resetStoreMemberPassword: ResetStoreMemberPasswordUseCase,
    private readonly updateStoreMemberStatus: UpdateStoreMemberStatusUseCase,
    private readonly storeRepository: StoreRepository,
  ) {}

  @Get(':storeId/team')
  @ApiOperation({ summary: 'Listar a equipe da loja' })
  async list(@Param('storeId') storeId: string) {
    const data = await this.listStoreMembers.execute({ storeId });
    return { data };
  }

  @Get(':storeId/team/roles')
  @ApiOperation({
    summary: 'Listar cargos disponíveis para a vertical da loja',
  })
  async listRoles(@Param('storeId') storeId: string) {
    const roles = await this.listStoreMemberRoles.execute({ storeId });
    return { data: roles };
  }

  @Post(':storeId/team')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar usuário à equipe da loja' })
  async create(
    @Param('storeId') storeId: string,
    @Body() body: UpsertStoreMemberBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { member, meta } = await this.upsertStoreMember.execute({
      storeId,
      ...body,
      actor: formatAuditActor(user),
    });
    return { data: await this.toView(storeId, member), meta };
  }

  @Put(':storeId/team/:memberId')
  @ApiOperation({ summary: 'Atualizar usuário da equipe da loja' })
  async update(
    @Param('storeId') storeId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpsertStoreMemberBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const { member } = await this.upsertStoreMember.execute({
      storeId,
      memberId,
      ...body,
      actor: formatAuditActor(user),
    });
    return { data: await this.toView(storeId, member) };
  }

  @Patch(':storeId/team/:memberId/status')
  @ApiOperation({
    summary: 'Ativar ou desativar membro da equipe (soft-status)',
  })
  async updateStatus(
    @Param('storeId') storeId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpdateStoreMemberStatusBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const member = await this.updateStoreMemberStatus.execute({
      storeId,
      memberId,
      status: body.status,
      actor: formatAuditActor(user),
    });
    return { data: await this.toView(storeId, member) };
  }

  @Post(':storeId/team/:memberId/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gerar nova senha provisória para o membro da loja',
  })
  async resetPassword(
    @Param('storeId') storeId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.resetStoreMemberPassword.execute({
      storeId,
      memberId,
      actor: formatAuditActor(user),
    });
    return { data };
  }

  @Delete(':storeId/team/:memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover usuário da equipe da loja' })
  async remove(
    @Param('storeId') storeId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.deleteStoreMember.execute({
      storeId,
      memberId,
      actor: formatAuditActor(user),
    });
    return { data: { id: memberId } };
  }

  private async toView(storeId: string, member: StoreMemberRow) {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new StoreNotFoundError(BackofficeStoreTeamRoute.name, storeId);
    }
    return {
      id: member.id,
      username: member.username,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      role: member.role,
      roleLabel:
        getRoleCatalogItem(store.vertical, member.role)?.label ?? member.role,
      permissions: member.permissions,
      hasPassword: member.hasPassword,
      status: deriveStoreMemberStatus(member),
      disabledAt: member.disabledAt?.toISOString() ?? null,
      provisionalExpiresAt: member.provisionalExpiresAt?.toISOString() ?? null,
    };
  }
}
