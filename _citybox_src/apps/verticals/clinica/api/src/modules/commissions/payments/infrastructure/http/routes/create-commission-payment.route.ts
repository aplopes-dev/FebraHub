import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCommissionPaymentUseCase } from '../../../application/use-cases/create-commission-payment/create-commission-payment.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateCommissionPaymentBodyDto } from './commission-payment.dto';
import { CommissionPaymentPresenter } from './commission-payment.presenter';

@ApiTags('commissions')
@Controller('v1/commissions/payments')
@RequirePermission('settle', 'FinancialCommission')
export class CreateCommissionPaymentRoute {
  constructor(
    private readonly createCommissionPayment: CreateCommissionPaymentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Pagar comissões em aberto' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateCommissionPaymentBodyDto,
  ) {
    const payment = await this.createCommissionPayment.execute({
      storeId,
      ...dto,
    });
    return CommissionPaymentPresenter.toCreatedHttp(payment);
  }
}
