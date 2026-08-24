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

@ApiTags('card-contracts')
@Controller('v1/card-contracts/:contractId/payment-methods')
export class DeletePaymentMethodRoute {
  constructor(
    private readonly deletePaymentMethod: DeletePaymentMethodUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Excluir forma de pagamento',
    description: 'Hard delete: a forma de pagamento e suas faixas somem.',
  })
  @ApiResponse({ status: 204, description: 'Forma de pagamento excluída' })
  @ApiResponse({
    status: 404,
    description: 'Contrato ou forma de pagamento não encontrados',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deletePaymentMethod.execute({ organizationId, contractId, id });
  }
}
