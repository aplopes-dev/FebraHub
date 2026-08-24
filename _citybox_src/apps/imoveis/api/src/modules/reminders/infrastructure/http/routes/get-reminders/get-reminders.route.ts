import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { resolveScopedAgentId } from '../../../../../../shared/infra/http/auth/resolve-scoped-agent-id';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { GetRemindersUseCase } from '../../../../application/use-cases/get-reminders/get-reminders.use-case';
import { GetRemindersPresenter } from './get-reminders.presenter';

@ApiTags('reminders')
@ApiBearerAuth()
@Controller('v1/reminders')
export class GetRemindersRoute {
  constructor(private readonly getReminders: GetRemindersUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Calendar')
  @ApiOperation({
    summary:
      'Lembretes agregados (follow-ups + agenda 7 dias); escopo do corretor',
  })
  @ApiQuery({
    name: 'agentId',
    required: false,
    description: 'Só admin/dono — filtro opcional',
  })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('agentId') agentId?: string,
  ) {
    const scopedAgentId = resolveScopedAgentId({
      user,
      scope,
      requestedAgentId: typeof agentId === 'string' ? agentId : undefined,
    });
    const result = await this.getReminders.execute({
      storeId,
      agentId: scopedAgentId,
    });
    return GetRemindersPresenter.toHttp(result);
  }
}
