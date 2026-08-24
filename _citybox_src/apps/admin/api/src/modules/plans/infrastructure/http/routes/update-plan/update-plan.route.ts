import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdatePlanUseCase } from '../../../../application/use-cases/update-plan/update-plan.use-case';
import { FindPlanByIdUseCase } from '../../../../application/use-cases/find-plan-by-id/find-plan-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { UpdatePlanBodyDto } from './update-plan.dto';
import { UpdatePlanPresenter } from './update-plan.presenter';

@ApiTags('plans')
@Controller('v1/platform/billing')
@RequirePermission('platform.admin')
export class UpdatePlanRoute {
  constructor(
    private readonly updatePlan: UpdatePlanUseCase,
    private readonly findPlanById: FindPlanByIdUseCase,
  ) {}

  @Put('plans/:id')
  @ApiOperation({ summary: 'Atualizar plano' })
  async handle(@Param('id') id: string, @Body() dto: UpdatePlanBodyDto) {
    const plan = await this.updatePlan.execute({ ...dto, id });
    const { subscriberCount } = await this.findPlanById.execute(plan.id);
    return UpdatePlanPresenter.toHttp(plan, subscriberCount);
  }
}
