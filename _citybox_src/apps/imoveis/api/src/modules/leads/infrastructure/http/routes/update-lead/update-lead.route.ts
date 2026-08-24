import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { assertCanAccessAgentResource } from '../../../../../../shared/infra/http/auth/assert-can-access-agent-resource';
import { resolveLeadAgentsForWrite } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { GetLeadByIdUseCase } from '../../../../application/use-cases/get-lead-by-id/get-lead-by-id.use-case';
import { UpdateLeadUseCase } from '../../../../application/use-cases/update-lead/update-lead.use-case';
import { UpdateLeadDto } from './update-lead.dto';
import { UpdateLeadPresenter } from './update-lead.presenter';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/leads')
export class UpdateLeadRoute {
  constructor(
    private readonly getLeadById: GetLeadByIdUseCase,
    private readonly updateLead: UpdateLeadUseCase,
  ) {}

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({ summary: 'Atualizar lead' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Body() dto: UpdateLeadDto,
  ) {
    const existing = await this.getLeadById.execute({ storeId, id });
    assertCanAccessAgentResource({
      user,
      scope,
      resourceAgentId: existing.agentId,
      resourceAgentIds: existing.agentIds,
      context: 'lead',
    });
    const agents = resolveLeadAgentsForWrite({
      user,
      scope,
      requestedAgentId: dto.agentId,
      requestedAgentIds: dto.agentIds,
    });
    const lead = await this.updateLead.execute({
      storeId,
      id,
      ...dto,
      agentId: agents.agentId,
      agentIds: agents.agentIds,
    });
    return UpdateLeadPresenter.toHttp(lead);
  }
}
