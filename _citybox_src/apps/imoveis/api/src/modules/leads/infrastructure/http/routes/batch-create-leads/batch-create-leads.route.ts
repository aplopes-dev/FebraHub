import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { resolveWritableAgentId } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { ValidatorDomainError } from '../../../../../../shared/core/errors/validator-domain.error';
import { BatchCreateLeadsUseCase } from '../../../../application/use-cases/batch-create-leads/batch-create-leads.use-case';
import { BatchCreateLeadsDto } from './batch-create-leads.dto';
import { BatchCreateLeadsPresenter } from './batch-create-leads.presenter';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/leads')
export class BatchCreateLeadsRoute {
  constructor(private readonly batchCreate: BatchCreateLeadsUseCase) {}

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({
    summary: 'Importar leads em lote (CSV)',
    description:
      'Cria leads vinculados à loja atual e ao corretor da sessão. Defaults: status new, origem walk-in.',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Body() dto: BatchCreateLeadsDto,
  ) {
    const assignedAgentId = resolveWritableAgentId({ user, scope });
    if (!assignedAgentId) {
      throw new ValidatorDomainError({
        internalMessage: 'Missing agentId on batch create leads',
        externalMessage:
          'Não foi possível identificar o corretor da sessão para importar leads.',
        context: BatchCreateLeadsRoute.name,
      });
    }

    const result = await this.batchCreate.execute({
      storeId,
      assignedAgentId,
      leads: dto.leads,
    });
    return BatchCreateLeadsPresenter.toHttp(result);
  }
}
