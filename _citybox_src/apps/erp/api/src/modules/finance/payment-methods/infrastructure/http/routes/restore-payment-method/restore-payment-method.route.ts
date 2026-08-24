import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestorePaymentMethodUseCase } from '../../../../application/use-cases/restore-payment-method/restore-payment-method.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PaymentMethodPresenter } from '../shared/payment-method.presenter';

@ApiTags('payment-methods')
@Controller('v1/payment-methods')
export class RestorePaymentMethodRoute {
  constructor(
    private readonly restorePaymentMethod: RestorePaymentMethodUseCase,
  ) {}

  @Post(':id/restore')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Restaurar forma de pagamento excluída',
    description: 'Idempotente: restaurar quem já está ativa devolve 200.',
  })
  @ApiResponse({
    status: 404,
    description: 'Forma de pagamento não encontrada',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const paymentMethod = await this.restorePaymentMethod.execute({
      organizationId,
      id,
    });
    return PaymentMethodPresenter.toHttpSingle(paymentMethod);
  }
}
