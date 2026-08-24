import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListClinicPlansUseCase } from '../../../../application/use-cases/list-clinic-plans/list-clinic-plans.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListClinicPlansPresenter } from '../shared/clinic-plan.presenters';

@ApiTags('clinic-plans')
@Controller('v1/clinic-plans')
@RequirePermission('manage', 'ClinicPlan')
export class ListClinicPlansRoute {
  constructor(private readonly listPlans: ListClinicPlansUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar planos da clínica' })
  async handle(@StoreId() storeId: string) {
    const plans = await this.listPlans.execute({ storeId });
    return ListClinicPlansPresenter.toHttp(plans);
  }
}
