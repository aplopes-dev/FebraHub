import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GenerateInvoicesUseCase } from '../../../../application/use-cases/generate-invoices/generate-invoices.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GenerateInvoicesJobBodyDto } from './generate-invoices-job.dto';

@ApiTags('invoices')
@Controller('v1/invoices')
@RequirePermission('platform.billing.manage')
export class GenerateInvoicesJobRoute {
  constructor(private readonly generateInvoices: GenerateInvoicesUseCase) {}

  @Post('generate-job')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Executar job de geração de faturas para assinaturas ativas',
  })
  async handle(@Body() body: GenerateInvoicesJobBodyDto) {
    return this.generateInvoices.execute(body);
  }
}
