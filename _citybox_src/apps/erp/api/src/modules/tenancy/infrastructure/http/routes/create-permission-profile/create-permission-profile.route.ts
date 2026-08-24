import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePermissionProfileUseCase } from '../../../../application/use-cases/create-permission-profile/create-permission-profile.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreatePermissionProfileHttpDto } from '../shared/permission-profile.dto';
import { PermissionProfilePresenter } from '../shared/permission-profile.presenter';

@ApiTags('permission-profiles')
@Controller('v1/permission-profiles')
export class CreatePermissionProfileRoute {
  constructor(
    private readonly createPermissionProfile: CreatePermissionProfileUseCase,
  ) {}

  @Post()
  @RequirePermission('org.members.manage')
  @ApiOperation({ summary: 'Criar perfil de acesso customizado' })
  @ApiResponse({ status: 201, description: 'Perfil criado' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  @ApiResponse({ status: 422, description: 'Permissões inválidas' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreatePermissionProfileHttpDto,
  ) {
    const profile = await this.createPermissionProfile.execute({
      organizationId,
      name: dto.name,
      description: dto.description,
      permissionIds: dto.permissionIds,
    });
    return PermissionProfilePresenter.toHttpSingle(profile);
  }
}
