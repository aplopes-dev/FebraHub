import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateManualInvoiceUseCase } from '../../../../application/use-cases/create-manual-invoice/create-manual-invoice.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CreateManualInvoiceBodyDto } from './create-manual-invoice.dto';
import { toInvoiceResponse } from '../shared/invoice-response.mapper';

@ApiTags('invoices')
@Controller('v1/invoices')
export class CreateManualInvoiceRoute {
  constructor(
    private readonly createManualInvoice: CreateManualInvoiceUseCase,
  ) {}

  @Post('manual')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('platform.billing.manage')
  @ApiOperation({ summary: 'Criar fatura manual para um cliente' })
  async handle(@Body() body: CreateManualInvoiceBodyDto) {
    const invoice = await this.createManualInvoice.execute(body);
    return toInvoiceResponse(invoice);
  }
}
