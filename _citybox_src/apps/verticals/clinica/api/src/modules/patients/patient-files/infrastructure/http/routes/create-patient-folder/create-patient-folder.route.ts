import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePatientFolderUseCase } from '../../../../application/use-cases/create-patient-folder/create-patient-folder.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientFolderResponse } from '../shared/patient-file-response.mapper';
import { CreatePatientFolderBodyDto } from './create-patient-folder.body.dto';

@ApiTags('patient-files')
@Controller('v1/patients/:patientId/folders')
@RequirePermission('create', 'PatientFile')
export class CreatePatientFolderRoute {
  constructor(
    private readonly createPatientFolder: CreatePatientFolderUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar pasta no drive do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Body() body: CreatePatientFolderBodyDto,
  ) {
    const folder = await this.createPatientFolder.execute({
      storeId,
      patientId,
      parentId: body.parentId ?? null,
      name: body.name,
    });

    return { data: toPatientFolderResponse(folder) };
  }
}
