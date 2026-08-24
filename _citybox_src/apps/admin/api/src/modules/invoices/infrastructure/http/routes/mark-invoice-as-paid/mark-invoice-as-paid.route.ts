import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarkInvoiceAsPaidUseCase } from '../../../../application/use-cases/mark-invoice-as-paid/mark-invoice-as-paid.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { MarkInvoiceAsPaidBodyDto } from './mark-invoice-as-paid.dto';
import { toInvoiceResponse } from '../shared/invoice-response.mapper';

@ApiTags('invoices')
@Controller('v1/invoices')
export class MarkInvoiceAsPaidRoute {
  constructor(private readonly markInvoiceAsPaid: MarkInvoiceAsPaidUseCase) {}

  @Post(':id/mark-paid')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('platform.billing.manage')
  @ApiOperation({ summary: 'Marcar fatura como paga manualmente' })
  async handle(
    @Param('id') id: string,
    @Body() body: MarkInvoiceAsPaidBodyDto,
  ) {
    const invoice = await this.markInvoiceAsPaid.execute({
      invoiceId: id,
      method: body.method,
    });
    return toInvoiceResponse(invoice);
  }
}
