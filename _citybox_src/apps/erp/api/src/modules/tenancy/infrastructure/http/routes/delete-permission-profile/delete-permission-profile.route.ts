import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeletePermissionProfileUseCase } from '../../../../application/use-cases/delete-permission-profile/delete-permission-profile.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('permission-profiles')
@Controller('v1/permission-profiles')
export class DeletePermissionProfileRoute {
  constructor(
    private readonly deletePermissionProfile: DeletePermissionProfileUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('org.members.manage')
  @ApiOperation({
    summary: 'Excluir perfil de acesso',
    description:
      'Soft-delete. Perfis de sistema e perfis com membros vinculados retornam 409.',
  })
  @ApiResponse({ status: 204, description: 'Perfil excluído' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Perfil de sistema ou em uso por membros',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deletePermissionProfile.execute({ organizationId, id });
  }
}
