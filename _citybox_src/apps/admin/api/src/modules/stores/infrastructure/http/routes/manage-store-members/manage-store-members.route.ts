import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DeleteStoreMemberUseCase,
  UpsertStoreMemberUseCase,
} from '../../../../application/use-cases/manage-store-members/manage-store-members.use-case';
import { ResetStoreMemberPasswordUseCase } from '../../../../application/use-cases/reset-store-member-password/reset-store-member-password.use-case';
import { SendStoreMemberPasswordLinkUseCase } from '../../../../application/use-cases/send-store-member-password-link/send-store-member-password-link.use-case';
import { ListStoreMemberRolesUseCase } from '../../../../application/use-cases/list-store-member-roles/list-store-member-roles.use-case';
import { FindStoreByIdUseCase } from '../../../../application/use-cases/find-store-by-id/find-store-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';
import { UpsertStoreMemberBodyDto } from '../shared/store-detail.dto';
import { FindStoreByIdPresenter } from '../find-store-by-id/find-store-by-id.presenter';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class ManageStoreMembersRoute {
  constructor(
    private readonly upsertStoreMember: UpsertStoreMemberUseCase,
    private readonly deleteStoreMember: DeleteStoreMemberUseCase,
    private readonly resetStoreMemberPassword: ResetStoreMemberPasswordUseCase,
    private readonly sendStoreMemberPasswordLink: SendStoreMemberPasswordLinkUseCase,
    private readonly listStoreMemberRoles: ListStoreMemberRolesUseCase,
    private readonly findStoreById: FindStoreByIdUseCase,
  ) {}

  @Get(':id/team/roles')
  @ApiOperation({
    summary: 'Listar cargos disponíveis para a vertical da loja',
  })
  async listRoles(@Param('id') storeId: string) {
    const roles = await this.listStoreMemberRoles.execute({ storeId });
    return { data: roles };
  }

  @Post(':id/team')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar usuário à equipe da loja' })
  async create(
    @Param('id') storeId: string,
    @Body() body: UpsertStoreMemberBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const actor = formatAuditActor(user);
    const { member: _member, meta } = await this.upsertStoreMember.execute({
      storeId,
      ...body,
      actor,
    });
    const result = await this.findStoreById.execute({ id: storeId });
    const response = FindStoreByIdPresenter.toHttp(
      result.store,
      result.related,
      null,
      [],
      result.teamSource,
    );
    return meta ? { ...response, meta } : response;
  }

  // `GET :id/team/available` e `POST :id/team/batch` saíram na Fase 10. Os dois serviam
  // para reaproveitar um membro já cadastrado em OUTRA loja do mesmo Cliente. Sem
  // Cliente, cada loja é um cliente independente — listar ou vincular membro de outra
  // loja passaria dado de equipe entre negócios distintos.

  @Put(':id/team/:memberId')
  @ApiOperation({ summary: 'Atualizar usuário da equipe da loja' })
  async update(
    @Param('id') storeId: string,
    @Param('memberId') memberId: string,
    @Body() body: UpsertStoreMemberBodyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.upsertStoreMember.execute({
      storeId,
      memberId,
      ...body,
      actor: formatAuditActor(user),
    });
    const result = await this.findStoreById.execute({ id: storeId });
    return FindStoreByIdPresenter.toHttp(
      result.store,
      result.related,
      null,
      [],
      result.teamSource,
    );
  }

  @Delete(':id/team/:memberId')
  @ApiOperation({ summary: 'Remover usuário da equipe da loja' })
  async remove(
    @Param('id') storeId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.deleteStoreMember.execute({
      storeId,
      memberId,
      actor: formatAuditActor(user),
    });
    const result = await this.findStoreById.execute({ id: storeId });
    return FindStoreByIdPresenter.toHttp(
      result.store,
      result.related,
      null,
      [],
      result.teamSource,
    );
  }

  @Post(':id/team/:memberId/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar nova senha provisória para usuário da loja' })
  async resetPassword(
    @Param('id') storeId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const meta = await this.resetStoreMemberPassword.execute({
      storeId,
      memberId,
      actor: formatAuditActor(user),
    });
    const result = await this.findStoreById.execute({ id: storeId });
    const response = FindStoreByIdPresenter.toHttp(
      result.store,
      result.related,
      null,
      [],
      result.teamSource,
    );
    return { ...response, meta };
  }

  @Post(':id/team/:memberId/send-password-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar link de redefinição de senha por e-mail' })
  async sendPasswordLink(
    @Param('id') storeId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.sendStoreMemberPasswordLink.execute({
      storeId,
      memberId,
      actor: formatAuditActor(user),
    });
    const result = await this.findStoreById.execute({ id: storeId });
    return FindStoreByIdPresenter.toHttp(
      result.store,
      result.related,
      null,
      [],
      result.teamSource,
    );
  }
}
