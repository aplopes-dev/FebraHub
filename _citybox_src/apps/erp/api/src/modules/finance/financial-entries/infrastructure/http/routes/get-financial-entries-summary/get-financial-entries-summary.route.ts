import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetFinancialEntriesSummaryUseCase } from '../../../../application/use-cases/get-financial-entries-summary/get-financial-entries-summary.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { GetFinancialEntriesSummaryQueryDto } from './get-financial-entries-summary.dto';

@ApiTags('financial-entries')
@Controller('v1/financial-entries')
export class GetFinancialEntriesSummaryRoute {
  constructor(
    private readonly getFinancialEntriesSummary: GetFinancialEntriesSummaryUseCase,
  ) {}

  @Get('summary')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Resumo do extrato (entradas/saídas/saldo)',
    description:
      'Aceita os mesmos filtros de `GET /v1/financial-entries` (menos paginação/ordenação/aba) e soma `amountCents` por operação sobre o conjunto filtrado inteiro — nunca só a página exibida.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: GetFinancialEntriesSummaryQueryDto,
  ) {
    const dto = await this.getFinancialEntriesSummary.execute({
      organizationId,
      operation: query.operation,
      status: query.status,
      chartOfAccountId: query.chartOfAccountId,
      costCenterId: query.costCenterId,
      bankAccountId: query.bankAccountId,
      search: query.search?.trim() || undefined,
      dueFrom: query.dueFrom ? new Date(query.dueFrom) : undefined,
      dueTo: query.dueTo ? new Date(query.dueTo) : undefined,
      competenceFrom: query.competenceFrom
        ? new Date(query.competenceFrom)
        : undefined,
      competenceTo: query.competenceTo
        ? new Date(query.competenceTo)
        : undefined,
    });

    return { data: dto };
  }
}
