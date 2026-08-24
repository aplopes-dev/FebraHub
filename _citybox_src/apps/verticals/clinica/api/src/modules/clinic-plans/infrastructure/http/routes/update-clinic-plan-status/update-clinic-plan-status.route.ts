import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateClinicPlanStatusUseCase } from '../../../../application/use-cases/update-clinic-plan-status/update-clinic-plan-status.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateClinicPlanStatusBodyDto } from '../shared/clinic-plan.http-dto';
import { ClinicPlanSummaryPresenter } from '../shared/clinic-plan.presenters';

@ApiTags('clinic-plans')
@Controller('v1/clinic-plans')
@RequirePermission('manage', 'ClinicPlan')
export class UpdateClinicPlanStatusRoute {
  constructor(
    private readonly updatePlanStatus: UpdateClinicPlanStatusUseCase,
  ) {}

  @Patch(':id/status')
  @ApiOperation({ summary: 'Ativar/desativar plano da clínica' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClinicPlanStatusBodyDto,
  ) {
    const plan = await this.updatePlanStatus.execute({
      storeId,
      id,
      active: dto.active,
    });
    return ClinicPlanSummaryPresenter.toHttp(plan);
  }
}
