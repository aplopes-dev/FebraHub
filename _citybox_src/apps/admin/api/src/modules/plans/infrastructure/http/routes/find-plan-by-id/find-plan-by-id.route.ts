import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindPlanByIdUseCase } from '../../../../application/use-cases/find-plan-by-id/find-plan-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FindPlanByIdPresenter } from './find-plan-by-id.presenter';

@ApiTags('plans')
@Controller('v1/platform/billing')
@RequirePermission('platform.admin')
export class FindPlanByIdRoute {
  constructor(private readonly findPlanById: FindPlanByIdUseCase) {}

  @Get('plans/:id')
  @ApiOperation({ summary: 'Detalhes de um plano' })
  async handle(@Param('id') id: string) {
    const result = await this.findPlanById.execute(id);
    return FindPlanByIdPresenter.toHttp(result.plan, result.subscriberCount);
  }
}
