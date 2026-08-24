import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientAnamnesisUseCase } from '../../../../application/use-cases/create-patient-anamnesis/create-patient-anamnesis.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreatePatientAnamnesisBodyDto } from '../shared/patient-anamnesis-body.dto';
import { toPatientAnamnesisDetailResponse } from '../shared/patient-anamnesis-response.mapper';

@ApiTags('patient-anamneses')
@Controller('v1/patients/:patientId/anamneses')
@RequirePermission('manage', 'PatientAnamnesis')
export class CreatePatientAnamnesisRoute {
  constructor(
    private readonly createPatientAnamnesis: CreatePatientAnamnesisUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir anamnese do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: CreatePatientAnamnesisBodyDto,
  ) {
    const anamnesis = await this.createPatientAnamnesis.execute({
      storeId,
      patientId,
      input: body,
    });
    return { data: toPatientAnamnesisDetailResponse(anamnesis) };
  }
}
