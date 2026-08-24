import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetStoreBillingUseCase } from '../../../../application/use-cases/get-store-billing/get-store-billing.use-case';
import { GetStoreBillingPresenter } from './get-store-billing.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings')
export class GetStoreBillingRoute {
  constructor(private readonly getStoreBilling: GetStoreBillingUseCase) {}

  @Get('billing')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Billing')
  @ApiOperation({ summary: 'Obter assinatura e cobrança da loja' })
  async handle(@StoreId() storeId: string) {
    const settings = await this.getStoreBilling.execute({ storeId });
    return GetStoreBillingPresenter.toHttp(settings);
  }
}
