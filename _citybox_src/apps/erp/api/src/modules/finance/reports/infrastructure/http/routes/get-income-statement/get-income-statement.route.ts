import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetIncomeStatementUseCase } from '../../../../application/use-cases/get-income-statement/get-income-statement.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { GetIncomeStatementQueryDto } from './get-income-statement.dto';
import { FinanceReportPresenter } from '../shared/finance-report.presenter';

@ApiTags('reports')
@Controller('v1/reports')
export class GetIncomeStatementRoute {
  constructor(private readonly getIncomeStatement: GetIncomeStatementUseCase) {}

  @Get('income-statement')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'DRE — relatório de resultados por data de competência',
    description:
      'Agrega os lançamentos por conta do plano → grupo financeiro, sempre nos 9 grupos ' +
      'fixos do modelo (classification=resultado com sign preenchido), na ordem de ' +
      'catalogOrder — mesmo os sem lançamento no período (totalCents: 0, nunca omitidos). ' +
      'operatingResultCents soma todos os grupos já com o sinal aplicado.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: GetIncomeStatementQueryDto,
  ) {
    const result = await this.getIncomeStatement.execute({
      organizationId,
      from: new Date(query.from),
      to: new Date(query.to),
    });
    return FinanceReportPresenter.toIncomeStatementHttp(result);
  }
}
