import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindPermissionProfileByIdUseCase } from '../../../../application/use-cases/find-permission-profile-by-id/find-permission-profile-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PermissionProfilePresenter } from '../shared/permission-profile.presenter';

@ApiTags('permission-profiles')
@Controller('v1/permission-profiles')
export class FindPermissionProfileByIdRoute {
  constructor(
    private readonly findPermissionProfile: FindPermissionProfileByIdUseCase,
  ) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar perfil de acesso',
    description: 'Devolve também o excluído — a aba Excluídos leva até ele.',
  })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const profile = await this.findPermissionProfile.execute({
      organizationId,
      id,
    });
    return PermissionProfilePresenter.toHttpSingle(profile);
  }
}
