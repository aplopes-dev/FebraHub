import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePaymentMethodUseCase } from '../../../../application/use-cases/create-payment-method/create-payment-method.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreatePaymentMethodHttpDto } from '../shared/card-payment-method.dto';
import { CardPaymentMethodPresenter } from '../shared/card-payment-method.presenter';

@ApiTags('card-contracts')
@Controller('v1/card-contracts/:contractId/payment-methods')
export class CreatePaymentMethodRoute {
  constructor(
    private readonly createPaymentMethod: CreatePaymentMethodUseCase,
  ) {}

  @Post()
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Criar forma de pagamento no contrato' })
  @ApiResponse({ status: 201, description: 'Forma de pagamento criada' })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  @ApiResponse({
    status: 422,
    description: 'Faixas progressivas inválidas ou sobrepostas',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Body() dto: CreatePaymentMethodHttpDto,
  ) {
    const method = await this.createPaymentMethod.execute({
      organizationId,
      contractId,
      ...dto,
    });
    return CardPaymentMethodPresenter.toHttpSingle(method);
  }
}
