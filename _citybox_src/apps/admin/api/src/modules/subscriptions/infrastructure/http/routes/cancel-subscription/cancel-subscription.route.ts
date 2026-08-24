import { Controller, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelSubscriptionUseCase } from '../../../../application/use-cases/cancel-subscription/cancel-subscription.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CancelSubscriptionPresenter } from './cancel-subscription.presenter';

@ApiTags('subscriptions')
@Controller('v1/platform/billing')
@RequirePermission('platform.admin')
export class CancelSubscriptionRoute {
  constructor(private readonly cancelSubscription: CancelSubscriptionUseCase) {}

  @Patch('subscriptions/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar assinatura' })
  async handle(@Param('id') id: string) {
    const subscription = await this.cancelSubscription.execute({ id });
    return CancelSubscriptionPresenter.toHttp(subscription);
  }
}
