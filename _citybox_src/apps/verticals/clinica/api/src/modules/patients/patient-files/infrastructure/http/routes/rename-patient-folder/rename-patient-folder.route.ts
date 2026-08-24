import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RenamePatientFolderUseCase } from '../../../../application/use-cases/rename-patient-folder/rename-patient-folder.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientFolderResponse } from '../shared/patient-file-response.mapper';
import { RenamePatientFolderBodyDto } from './rename-patient-folder.body.dto';

@ApiTags('patient-files')
@Controller('v1/patients/:patientId/folders')
@RequirePermission('update', 'PatientFile')
export class RenamePatientFolderRoute {
  constructor(
    private readonly renamePatientFolder: RenamePatientFolderUseCase,
  ) {}

  @Patch(':folderId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renomear pasta do drive do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('folderId') folderId: string,
    @Body() body: RenamePatientFolderBodyDto,
  ) {
    const folder = await this.renamePatientFolder.execute({
      storeId,
      patientId,
      folderId,
      name: body.name,
    });

    return { data: toPatientFolderResponse(folder) };
  }
}
