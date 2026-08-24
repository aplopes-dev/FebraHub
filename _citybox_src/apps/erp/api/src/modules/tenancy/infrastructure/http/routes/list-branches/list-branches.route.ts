import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListBranchesUseCase } from '../../../../application/use-cases/list-branches/list-branches.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { Tenant } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { ListBranchesQueryDto } from '../shared/branch.dto';
import { BranchPresenter } from '../shared/branch.presenter';

@ApiTags('branches')
@Controller('v1/branches')
export class ListBranchesRoute {
  constructor(private readonly listBranches: ListBranchesUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar unidades',
    description:
      'Unidades da organização ativa. Um MEMBER só enxerga as unidades a que tem acesso.',
  })
  async handle(
    @Tenant() tenant: TenantContext,
    @Query() query: ListBranchesQueryDto,
  ) {
    const result = await this.listBranches.execute({
      organizationId: tenant.organizationId,
      search: query.search,
      activeOnly: query.active,
      // O recorte por acesso vem do contexto, não da query: quem pede não
      // escolhe o que pode ver.
      allowedBranchIds: tenant.branchIds,
      page: query.page,
      perPage: query.perPage,
    });

    return BranchPresenter.toHttpList(result);
  }
}
