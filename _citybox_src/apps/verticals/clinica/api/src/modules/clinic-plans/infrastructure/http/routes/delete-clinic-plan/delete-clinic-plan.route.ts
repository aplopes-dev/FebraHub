import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteClinicPlanUseCase } from '../../../../application/use-cases/delete-clinic-plan/delete-clinic-plan.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('clinic-plans')
@Controller('v1/clinic-plans')
@RequirePermission('manage', 'ClinicPlan')
export class DeleteClinicPlanRoute {
  constructor(private readonly deletePlan: DeleteClinicPlanUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir plano da clínica' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deletePlan.execute({ storeId, id });
  }
}
