import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetClinicPlanByIdUseCase } from '../../../../application/use-cases/get-clinic-plan-by-id/get-clinic-plan-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ClinicPlanDetailPresenter } from '../shared/clinic-plan.presenters';

@ApiTags('clinic-plans')
@Controller('v1/clinic-plans')
@RequirePermission('manage', 'ClinicPlan')
export class GetClinicPlanByIdRoute {
  constructor(private readonly getPlanById: GetClinicPlanByIdUseCase) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Obter plano da clínica com especialidades e procedimentos',
  })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const aggregate = await this.getPlanById.execute({ storeId, id });
    return ClinicPlanDetailPresenter.toHttp(aggregate);
  }
}
