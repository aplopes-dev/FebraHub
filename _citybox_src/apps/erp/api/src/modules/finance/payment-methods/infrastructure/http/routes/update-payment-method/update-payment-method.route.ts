import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePaymentMethodUseCase } from '../../../../application/use-cases/update-payment-method/update-payment-method.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdatePaymentMethodHttpDto } from '../shared/payment-method.dto';
import { PaymentMethodPresenter } from '../shared/payment-method.presenter';

@ApiTags('payment-methods')
@Controller('v1/payment-methods')
export class UpdatePaymentMethodRoute {
  constructor(
    private readonly updatePaymentMethod: UpdatePaymentMethodUseCase,
  ) {}

  @Put(':id')
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Atualizar forma de pagamento' })
  @ApiResponse({
    status: 404,
    description: 'Forma de pagamento não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Nome já cadastrado, ou forma de sistema (não editável)',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentMethodHttpDto,
  ) {
    const paymentMethod = await this.updatePaymentMethod.execute({
      organizationId,
      id,
      name: dto.name,
      fiscalCode: dto.fiscalCode ?? null,
      installmentPermission: dto.installmentPermission ?? null,
    });
    return PaymentMethodPresenter.toHttpSingle(paymentMethod);
  }
}
