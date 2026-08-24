import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindBranchByIdUseCase } from '../../../../application/use-cases/find-branch-by-id/find-branch-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { Tenant } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { BranchPresenter } from '../shared/branch.presenter';

@ApiTags('branches')
@Controller('v1/branches')
export class FindBranchByIdRoute {
  constructor(private readonly findBranch: FindBranchByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhe da unidade',
    description:
      'Um MEMBER só enxerga as unidades a que tem acesso — as demais respondem 404, como as de outra organização.',
  })
  @ApiResponse({ status: 404, description: 'Unidade não encontrada' })
  async handle(
    @Tenant() tenant: TenantContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const branch = await this.findBranch.execute({
      organizationId: tenant.organizationId,
      id,
      // Vem do contexto, não da query: quem pede não escolhe o que pode ver.
      allowedBranchIds: tenant.branchIds,
    });
    return BranchPresenter.toHttpSingle(branch);
  }
}
