import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientContractEmissionUseCase } from '../../../../application/use-cases/create-patient-contract-emission/create-patient-contract-emission.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpsertPatientContractEmissionBodyDto } from '../shared/patient-contract-emission-body.dto';
import { toPatientContractEmissionDetailResponse } from '../shared/patient-contract-emission-response.mapper';

@ApiTags('patient-contract-emissions')
@Controller('v1/patients/:patientId/contracts')
@RequirePermission('manage', 'PatientDocument')
export class CreatePatientContractEmissionRoute {
  constructor(
    private readonly createPatientContractEmission: CreatePatientContractEmissionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir contrato do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: UpsertPatientContractEmissionBodyDto,
  ) {
    const emission = await this.createPatientContractEmission.execute({
      storeId,
      patientId,
      input: body,
    });
    return { data: toPatientContractEmissionDetailResponse(emission) };
  }
}
