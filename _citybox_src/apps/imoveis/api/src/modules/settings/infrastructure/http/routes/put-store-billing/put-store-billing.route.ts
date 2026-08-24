import { Body, Controller, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { PutStoreBillingUseCase } from '../../../../application/use-cases/put-store-billing/put-store-billing.use-case';
import { PutStoreBillingDto } from './put-store-billing.dto';
import { PutStoreBillingPresenter } from './put-store-billing.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings')
export class PutStoreBillingRoute {
  constructor(private readonly putStoreBilling: PutStoreBillingUseCase) {}

  @Put('billing')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Billing')
  @ApiOperation({ summary: 'Salvar assinatura e cobrança da loja' })
  async handle(@StoreId() storeId: string, @Body() dto: PutStoreBillingDto) {
    const settings = await this.putStoreBilling.execute({
      storeId,
      planName: dto.planName,
      status: dto.status,
      renewsAt: dto.renewsAt,
      amountCents: dto.amountCents,
    });
    return PutStoreBillingPresenter.toHttp(settings);
  }
}
