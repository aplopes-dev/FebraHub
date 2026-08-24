import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListPaymentMethodsUseCase } from '../../../../application/use-cases/list-payment-methods/list-payment-methods.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CardPaymentMethodPresenter } from '../shared/card-payment-method.presenter';

@ApiTags('card-contracts')
@Controller('v1/card-contracts/:contractId/payment-methods')
export class ListPaymentMethodsRoute {
  constructor(private readonly listPaymentMethods: ListPaymentMethodsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar formas de pagamento do contrato',
    description: 'Sem paginação: um contrato tem poucas formas de pagamento.',
  })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ) {
    const methods = await this.listPaymentMethods.execute({
      organizationId,
      contractId,
    });
    return CardPaymentMethodPresenter.toHttpList(methods);
  }
}
