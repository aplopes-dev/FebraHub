import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateClinicPlanUseCase } from '../../../../application/use-cases/create-clinic-plan/create-clinic-plan.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateClinicPlanBodyDto } from '../shared/clinic-plan.http-dto';
import {
  mapSpecialtiesFromHttp,
  mapTreatmentInitFromHttp,
} from '../shared/clinic-plan-request.mapper';
import { ClinicPlanDetailPresenter } from '../shared/clinic-plan.presenters';

@ApiTags('clinic-plans')
@Controller('v1/clinic-plans')
@RequirePermission('manage', 'ClinicPlan')
export class CreateClinicPlanRoute {
  constructor(private readonly createPlan: CreateClinicPlanUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar plano da clínica' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateClinicPlanBodyDto,
  ) {
    const aggregate = await this.createPlan.execute({
      storeId,
      name: dto.name,
      status: dto.status,
      isDefault: dto.isDefault,
      treatmentInit: mapTreatmentInitFromHttp(dto.treatmentInit),
      specialties: mapSpecialtiesFromHttp(dto.specialties),
    });
    return ClinicPlanDetailPresenter.toHttp(aggregate);
  }
}
