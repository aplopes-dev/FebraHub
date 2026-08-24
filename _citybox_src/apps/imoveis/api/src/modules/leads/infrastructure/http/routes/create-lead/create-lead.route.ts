import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { resolveLeadAgentsForWrite } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { CreateLeadUseCase } from '../../../../application/use-cases/create-lead/create-lead.use-case';
import { CreateLeadDto } from './create-lead.dto';
import { CreateLeadPresenter } from './create-lead.presenter';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/leads')
export class CreateLeadRoute {
  constructor(private readonly createLead: CreateLeadUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({ summary: 'Criar lead' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Body() dto: CreateLeadDto,
  ) {
    const agents = resolveLeadAgentsForWrite({
      user,
      scope,
      requestedAgentId: dto.agentId,
      requestedAgentIds: dto.agentIds,
    });
    const lead = await this.createLead.execute({
      storeId,
      ...dto,
      agentId: agents.agentId,
      agentIds: agents.agentIds,
    });
    return CreateLeadPresenter.toHttp(lead);
  }
}
