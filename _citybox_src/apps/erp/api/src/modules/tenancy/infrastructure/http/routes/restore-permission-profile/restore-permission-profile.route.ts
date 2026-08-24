import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestorePermissionProfileUseCase } from '../../../../application/use-cases/restore-permission-profile/restore-permission-profile.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PermissionProfilePresenter } from '../shared/permission-profile.presenter';

@ApiTags('permission-profiles')
@Controller('v1/permission-profiles')
export class RestorePermissionProfileRoute {
  constructor(
    private readonly restorePermissionProfile: RestorePermissionProfileUseCase,
  ) {}

  @Post(':id/restore')
  @RequirePermission('org.members.manage')
  @ApiOperation({
    summary: 'Restaurar perfil de acesso excluído',
    description: 'Idempotente: restaurar quem já está ativo devolve 200.',
  })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome já em uso por outro ativo' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const profile = await this.restorePermissionProfile.execute({
      organizationId,
      id,
    });
    return PermissionProfilePresenter.toHttpSingle(profile);
  }
}
