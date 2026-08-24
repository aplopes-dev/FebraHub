import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListPlansUseCase } from '../../../../application/use-cases/list-plans/list-plans.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { ListPlansPresenter } from './list-plans.presenter';
import { parseCsvParam } from './list-plans.query';
import { SubscriptionCycle } from '../../../../../subscriptions/domain/entities/subscription.entity';
import { PlanStatus } from '../../../../../../../generated/prisma/enums';

@ApiTags('plans')
@Controller('v1/platform/billing')
@RequirePermission('platform.admin')
export class ListPlansRoute {
  constructor(private readonly listPlans: ListPlansUseCase) {}

  @Get('plans')
  @ApiOperation({ summary: 'Listar planos' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'billingCycle', required: false })
  @ApiQuery({ name: 'vertical', required: false })
  async handle(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('status') status?: string | string[],
    @Query('billingCycle') billingCycle?: string | string[],
    @Query('vertical') vertical?: string,
  ) {
    const result = await this.listPlans.execute({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search:
        typeof search === 'string' ? search.trim() || undefined : undefined,
      status: parseCsvParam(status) as PlanStatus[] | undefined,
      billingCycle: parseCsvParam(billingCycle) as
        | SubscriptionCycle[]
        | undefined,
      vertical:
        typeof vertical === 'string' ? vertical.trim() || undefined : undefined,
    });

    return ListPlansPresenter.toHttp(result.plans, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
