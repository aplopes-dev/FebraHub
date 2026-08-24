import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdatePaymentMethodUseCase } from '../../../../application/use-cases/update-payment-method/update-payment-method.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdatePaymentMethodHttpDto } from '../shared/card-payment-method.dto';
import { CardPaymentMethodPresenter } from '../shared/card-payment-method.presenter';

@ApiTags('card-contracts')
@Controller('v1/card-contracts/:contractId/payment-methods')
export class UpdatePaymentMethodRoute {
  constructor(
    private readonly updatePaymentMethod: UpdatePaymentMethodUseCase,
  ) {}

  @Put(':id')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Atualizar forma de pagamento',
    description:
      'Substitui o conjunto de faixas progressivas enviado no corpo.',
  })
  @ApiResponse({
    status: 404,
    description: 'Contrato ou forma de pagamento não encontrados',
  })
  @ApiResponse({
    status: 422,
    description: 'Faixas progressivas inválidas ou sobrepostas',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentMethodHttpDto,
  ) {
    const method = await this.updatePaymentMethod.execute({
      organizationId,
      contractId,
      id,
      ...dto,
    });
    return CardPaymentMethodPresenter.toHttpSingle(method);
  }
}
