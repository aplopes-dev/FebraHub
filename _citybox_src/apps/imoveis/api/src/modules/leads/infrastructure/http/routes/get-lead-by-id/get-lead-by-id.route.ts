import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { assertCanAccessAgentResource } from '../../../../../../shared/infra/http/auth/assert-can-access-agent-resource';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { FindPipelineDealByLeadUseCase } from '../../../../../deals/application/use-cases/find-pipeline-deal-by-lead/find-pipeline-deal-by-lead.use-case';
import { GetLeadByIdUseCase } from '../../../../application/use-cases/get-lead-by-id/get-lead-by-id.use-case';
import { GetLeadByIdPresenter } from './get-lead-by-id.presenter';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/leads')
export class GetLeadByIdRoute {
  constructor(
    private readonly getLeadById: GetLeadByIdUseCase,
    private readonly findPipelineDealByLead: FindPipelineDealByLeadUseCase,
  ) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Lead')
  @ApiOperation({ summary: 'Detalhe do lead' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    const [lead, activeDeal] = await Promise.all([
      this.getLeadById.execute({ storeId, id }),
      this.findPipelineDealByLead.execute({ storeId, leadId: id }),
    ]);
    assertCanAccessAgentResource({
      user,
      scope,
      resourceAgentId: lead.agentId,
      resourceAgentIds: lead.agentIds,
      context: 'lead',
    });
    return GetLeadByIdPresenter.toHttp(lead, activeDeal);
  }
}
