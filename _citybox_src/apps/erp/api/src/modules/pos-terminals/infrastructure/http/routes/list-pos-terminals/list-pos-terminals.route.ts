import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPosTerminalsUseCase } from '../../../../application/use-cases/list-pos-terminals/list-pos-terminals.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { Tenant } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import type { TenantContext } from '../../../../../../shared/infra/tenancy/tenant-context';
import { ListPosTerminalsQueryDto } from '../shared/pos-terminal.dto';
import { PosTerminalPresenter } from '../shared/pos-terminal.presenter';

@ApiTags('pos-terminals')
@Controller('v1/pos-terminals')
export class ListPosTerminalsRoute {
  constructor(private readonly listPosTerminals: ListPosTerminalsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar terminais de PDV',
    description:
      'Um MEMBER só enxerga os terminais das unidades a que tem acesso (mesmo recorte de `ListBranches`).',
  })
  async handle(
    @Tenant() tenant: TenantContext,
    @Query() query: ListPosTerminalsQueryDto,
  ) {
    const result = await this.listPosTerminals.execute({
      organizationId: tenant.organizationId,
      search: query.search?.trim() || undefined,
      status: query.status,
      allowedBranchIds: tenant.branchIds,
      page: query.page,
      perPage: query.perPage,
    });

    return PosTerminalPresenter.toHttpList(result);
  }
}
