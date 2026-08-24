import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPaymentMethodsUseCase } from '../../../../application/use-cases/list-payment-methods/list-payment-methods.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListPaymentMethodsQueryDto } from '../shared/payment-method.dto';
import { PaymentMethodPresenter } from '../shared/payment-method.presenter';

@ApiTags('payment-methods')
@Controller('v1/payment-methods')
export class ListPaymentMethodsRoute {
  constructor(private readonly listPaymentMethods: ListPaymentMethodsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar formas de pagamento',
    description:
      '`tabCounts` conta o cadastro inteiro da organização, ignorando a busca. ' +
      'Sem endpoint `/options` dedicado — o select de lançamentos consome esta ' +
      'mesma rota com `perPage` alto (mesmo padrão de `cost-centers`).',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListPaymentMethodsQueryDto,
  ) {
    const result = await this.listPaymentMethods.execute({
      organizationId,
      tab: query.tab,
      search: query.search?.trim() || undefined,
      page: query.page,
      perPage: query.perPage,
    });
    return PaymentMethodPresenter.toHttpList(result);
  }
}
