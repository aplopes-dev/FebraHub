import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeletePaymentMethodUseCase } from '../../../../application/use-cases/delete-payment-method/delete-payment-method.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('payment-methods')
@Controller('v1/payment-methods')
export class DeletePaymentMethodRoute {
  constructor(
    private readonly deletePaymentMethod: DeletePaymentMethodUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Excluir forma de pagamento',
    description:
      'Soft-delete: pagamentos já registrados continuam apontando para ela. ' +
      'Bloqueada se for de sistema ou estiver em uso em algum lançamento.',
  })
  @ApiResponse({ status: 204, description: 'Forma de pagamento excluída' })
  @ApiResponse({
    status: 404,
    description: 'Forma de pagamento não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Forma de sistema, ou em uso em lançamentos existentes',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deletePaymentMethod.execute({ organizationId, id });
  }
}
