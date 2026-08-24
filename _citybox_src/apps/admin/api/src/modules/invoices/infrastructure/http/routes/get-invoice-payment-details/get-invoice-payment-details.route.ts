import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetInvoicePaymentDetailsUseCase } from '../../../../application/use-cases/get-invoice-payment-details/get-invoice-payment-details.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('invoices')
@Controller('v1/invoices')
@RequirePermission('platform.admin')
export class GetInvoicePaymentDetailsRoute {
  constructor(
    private readonly getInvoicePaymentDetails: GetInvoicePaymentDetailsUseCase,
  ) {}

  @Get(':id/payment-details')
  @ApiOperation({
    summary: 'Obter detalhes de pagamento (boleto/pix) de uma fatura',
  })
  async handle(@Param('id') id: string) {
    const details = await this.getInvoicePaymentDetails.execute(id);
    return {
      gatewayPaymentId: details.gatewayPaymentId,
      gatewayCustomerId: details.gatewayCustomerId,
      gatewaySubscriptionId: details.gatewaySubscriptionId,
      value: details.value,
      status: details.status,
      billingType: details.billingType,
      dueDate: details.dueDate.toISOString(),
      invoiceUrl: details.invoiceUrl ?? null,
      bankSlipUrl: details.bankSlipUrl ?? null,
      bankSlipBarCode: details.bankSlipBarCode ?? null,
      pixQrCode: details.pixQrCode ?? null,
      pixCopyPaste: details.pixCopyPaste ?? null,
      description: details.description ?? null,
    };
  }
}
