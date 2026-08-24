import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListSubscriptionsUseCase } from '../../../../application/use-cases/list-subscriptions/list-subscriptions.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListSubscriptionsQueryDto } from './list-subscriptions.query';
import { ListSubscriptionsPresenter } from './list-subscriptions.presenter';

@ApiTags('subscriptions')
@Controller('v1/platform/billing')
@RequirePermission('platform.admin')
export class ListSubscriptionsRoute {
  constructor(private readonly listSubscriptions: ListSubscriptionsUseCase) {}

  @Get('subscriptions')
  @ApiOperation({ summary: 'Listar assinaturas' })
  async handle(@Query() query: ListSubscriptionsQueryDto) {
    const result = await this.listSubscriptions.execute({
      page: query.page,
      perPage: query.perPage,
      storeId: query.storeId,
      planPriceId: query.planPriceId,
      status: query.status ? [query.status] : undefined,
    });
    return ListSubscriptionsPresenter.toHttp(result);
  }
}
