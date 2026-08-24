import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindInvoiceByIdUseCase } from '../../../../application/use-cases/find-invoice-by-id/find-invoice-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { toInvoiceResponse } from '../shared/invoice-response.mapper';

@ApiTags('invoices')
@Controller('v1/invoices')
@RequirePermission('platform.admin')
export class FindInvoiceByIdRoute {
  constructor(private readonly findInvoiceById: FindInvoiceByIdUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma fatura por ID' })
  async handle(@Param('id') id: string) {
    const invoice = await this.findInvoiceById.execute(id);
    return toInvoiceResponse(invoice);
  }
}
