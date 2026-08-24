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
import { GetTransactionsReportUseCase } from '../../../../application/use-cases/get-transactions-report/get-transactions-report.use-case';
import { GetTransactionsReportPresenter } from './get-transactions-report.presenter';

/**
 * Registrado **antes** de `GetTransactionByIdRoute` no module: o Nest resolve rotas
 * na ordem de registro, e `:id` casaria com `report`.
 */
@ApiTags('transactions')
@ApiBearerAuth()
@Controller('v1/transactions')
export class GetTransactionsReportRoute {
  constructor(
    private readonly getTransactionsReport: GetTransactionsReportUseCase,
  ) {}

  @Get('report')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Transaction')
  @ApiOperation({
    summary: 'Relatório de negócios por período (escopo do corretor)',
  })
  @ApiQuery({ name: 'from', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, description: 'YYYY-MM-DD' })
  async handle(
    @StoreId() storeId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const agentId = resolveScopedAgentId({ user, scope });
    const report = await this.getTransactionsReport.execute({
      storeId,
      from: typeof from === 'string' ? from : undefined,
      to: typeof to === 'string' ? to : undefined,
      agentId,
    });
    return GetTransactionsReportPresenter.toHttp(report);
  }
}
