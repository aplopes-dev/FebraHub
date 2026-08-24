import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePermissionProfileUseCase } from '../../../../application/use-cases/update-permission-profile/update-permission-profile.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdatePermissionProfileHttpDto } from '../shared/permission-profile.dto';
import { PermissionProfilePresenter } from '../shared/permission-profile.presenter';

@ApiTags('permission-profiles')
@Controller('v1/permission-profiles')
export class UpdatePermissionProfileRoute {
  constructor(
    private readonly updatePermissionProfile: UpdatePermissionProfileUseCase,
  ) {}

  @Put(':id')
  @RequirePermission('org.members.manage')
  @ApiOperation({
    summary: 'Atualizar perfil de acesso customizado',
    description: 'Perfis de sistema não são editáveis.',
  })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Nome já cadastrado ou perfil de sistema',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermissionProfileHttpDto,
  ) {
    const profile = await this.updatePermissionProfile.execute({
      organizationId,
      id,
      name: dto.name,
      description: dto.description,
      permissionIds: dto.permissionIds,
    });
    return PermissionProfilePresenter.toHttpSingle(profile);
  }
}
