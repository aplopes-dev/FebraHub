import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPermissionProfilesUseCase } from '../../../../application/use-cases/list-permission-profiles/list-permission-profiles.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListPermissionProfilesQueryDto } from '../shared/permission-profile.dto';
import { PermissionProfilePresenter } from '../shared/permission-profile.presenter';

@ApiTags('permission-profiles')
@Controller('v1/permission-profiles')
export class ListPermissionProfilesRoute {
  constructor(
    private readonly listPermissionProfiles: ListPermissionProfilesUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar perfis de acesso da organização' })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListPermissionProfilesQueryDto,
  ) {
    const result = await this.listPermissionProfiles.execute({
      organizationId,
      search: query.search?.trim() || undefined,
      activeOnly: query.activeOnly,
      page: query.page,
      perPage: query.perPage,
    });
    return PermissionProfilePresenter.toHttpList(result);
  }
}
