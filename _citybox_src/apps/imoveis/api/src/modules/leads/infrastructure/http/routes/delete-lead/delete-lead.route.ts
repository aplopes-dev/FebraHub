import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
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
import { DeleteLeadUseCase } from '../../../../application/use-cases/delete-lead/delete-lead.use-case';
import { GetLeadByIdUseCase } from '../../../../application/use-cases/get-lead-by-id/get-lead-by-id.use-case';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/leads')
export class DeleteLeadRoute {
  constructor(
    private readonly getLeadById: GetLeadByIdUseCase,
    private readonly deleteLead: DeleteLeadUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({ summary: 'Excluir lead' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    const existing = await this.getLeadById.execute({ storeId, id });
    assertCanAccessAgentResource({
      user,
      scope,
      resourceAgentId: existing.agentId,
      resourceAgentIds: existing.agentIds,
      context: 'lead',
    });
    await this.deleteLead.execute({ storeId, id });
  }
}
