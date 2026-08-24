import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientUseCase } from '../../../../application/use-cases/create-patient/create-patient.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertPatientBodyDto } from '../shared/patient-body.dto';
import { toPatientFormResponse } from '../shared/patient-response.mapper';

@ApiTags('patients')
@Controller('v1/patients')
@RequirePermission('create', 'Patient')
export class CreatePatientRoute {
  constructor(private readonly createPatient: CreatePatientUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar paciente' })
  async handle(@StoreId() storeId: string, @Body() dto: UpsertPatientBodyDto) {
    const detail = await this.createPatient.execute({ storeId, input: dto });
    return { data: toPatientFormResponse(detail) };
  }
}
