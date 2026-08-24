import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePaymentMethodUseCase } from '../../../../application/use-cases/create-payment-method/create-payment-method.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreatePaymentMethodHttpDto } from '../shared/payment-method.dto';
import { PaymentMethodPresenter } from '../shared/payment-method.presenter';

@ApiTags('payment-methods')
@Controller('v1/payment-methods')
export class CreatePaymentMethodRoute {
  constructor(
    private readonly createPaymentMethod: CreatePaymentMethodUseCase,
  ) {}

  @Post()
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Criar forma de pagamento' })
  @ApiResponse({ status: 201, description: 'Forma de pagamento criada' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreatePaymentMethodHttpDto,
  ) {
    const paymentMethod = await this.createPaymentMethod.execute({
      organizationId,
      name: dto.name,
      fiscalCode: dto.fiscalCode ?? null,
      installmentPermission: dto.installmentPermission ?? null,
    });
    return PaymentMethodPresenter.toHttpSingle(paymentMethod);
  }
}
