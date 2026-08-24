import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
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
import { ListPersonalCommissionsUseCase } from '../../../../application/use-cases/list-personal-commissions/list-personal-commissions.use-case';
import { ListPersonalCommissionsPresenter } from './list-personal-commissions.presenter';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('v1/finance')
export class ListPersonalCommissionsRoute {
  constructor(
    private readonly listPersonalCommissions: ListPersonalCommissionsUseCase,
  ) {}

  @Get('commissions')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Finance')
  @ApiOperation({
    summary: 'Comissões pessoais do corretor (escopo forçado se não-admin)',
  })
  @ApiQuery({
    name: 'agentId',
    required: false,
    description: 'Admin: obrigatório o alvo; corretor ignora e usa o próprio',
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
    if (!scopedAgentId) {
      throw new BadRequestException(
        'agentId é obrigatório para visão de administrador da loja.',
      );
    }
    const entries = await this.listPersonalCommissions.execute({
      storeId,
      agentId: scopedAgentId,
    });
    return ListPersonalCommissionsPresenter.toHttp(entries);
  }
}
