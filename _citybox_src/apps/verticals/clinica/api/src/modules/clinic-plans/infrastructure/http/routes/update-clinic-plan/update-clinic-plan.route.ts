import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateClinicPlanUseCase } from '../../../../application/use-cases/update-clinic-plan/update-clinic-plan.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateClinicPlanBodyDto } from '../shared/clinic-plan.http-dto';
import { mapSpecialtiesFromHttp } from '../shared/clinic-plan-request.mapper';
import { ClinicPlanDetailPresenter } from '../shared/clinic-plan.presenters';

@ApiTags('clinic-plans')
@Controller('v1/clinic-plans')
@RequirePermission('manage', 'ClinicPlan')
export class UpdateClinicPlanRoute {
  constructor(private readonly updatePlan: UpdateClinicPlanUseCase) {}

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar plano da clínica' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateClinicPlanBodyDto,
  ) {
    const aggregate = await this.updatePlan.execute({
      storeId,
      id,
      name: dto.name,
      status: dto.status,
      isDefault: dto.isDefault,
      specialties: mapSpecialtiesFromHttp(dto.specialties),
    });
    return ClinicPlanDetailPresenter.toHttp(aggregate);
  }
}
