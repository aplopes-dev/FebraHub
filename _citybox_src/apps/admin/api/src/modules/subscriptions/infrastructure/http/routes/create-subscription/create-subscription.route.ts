import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSubscriptionUseCase } from '../../../../application/use-cases/create-subscription/create-subscription.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CreateSubscriptionBodyDto } from './create-subscription.dto';
import { CreateSubscriptionPresenter } from './create-subscription.presenter';

@ApiTags('subscriptions')
@Controller('v1/platform/billing')
@RequirePermission('platform.admin')
export class CreateSubscriptionRoute {
  constructor(private readonly createSubscription: CreateSubscriptionUseCase) {}

  @Post('subscriptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar assinatura' })
  async handle(@Body() dto: CreateSubscriptionBodyDto) {
    const subscription = await this.createSubscription.execute(dto);
    return CreateSubscriptionPresenter.toHttp(subscription);
  }
}
