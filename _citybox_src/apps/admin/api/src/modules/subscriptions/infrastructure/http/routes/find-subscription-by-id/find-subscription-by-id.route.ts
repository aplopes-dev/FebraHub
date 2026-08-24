import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindSubscriptionByIdUseCase } from '../../../../application/use-cases/find-subscription-by-id/find-subscription-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FindSubscriptionByIdPresenter } from './find-subscription-by-id.presenter';

@ApiTags('subscriptions')
@Controller('v1/platform/billing')
@RequirePermission('platform.admin')
export class FindSubscriptionByIdRoute {
  constructor(
    private readonly findSubscriptionById: FindSubscriptionByIdUseCase,
  ) {}

  @Get('subscriptions/:id')
  @ApiOperation({ summary: 'Buscar assinatura por ID' })
  async handle(@Param('id') id: string) {
    const subscription = await this.findSubscriptionById.execute({ id });
    return FindSubscriptionByIdPresenter.toHttp(subscription);
  }
}
