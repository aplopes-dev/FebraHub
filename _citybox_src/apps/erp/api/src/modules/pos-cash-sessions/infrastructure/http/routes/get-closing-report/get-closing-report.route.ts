import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetClosingReportUseCase } from '../../../../application/use-cases/get-closing-report/get-closing-report.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-cash-sessions')
@Controller('v1/pos-cash-sessions')
export class GetClosingReportRoute {
  constructor(private readonly getClosingReport: GetClosingReportUseCase) {}

  @Get(':id/closing-report')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Comprovante gerencial de fechamento' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') sessionId: string,
  ) {
    const report = await this.getClosingReport.execute({
      organizationId,
      sessionId,
    });
    return PosCashSessionPresenter.toHttpClosingReport(report);
  }
}
