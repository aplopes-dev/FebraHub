import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientDriveUseCase } from '../../../../application/use-cases/list-patient-drive/list-patient-drive.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  toPatientFileResponse,
  toPatientFolderResponse,
} from '../shared/patient-file-response.mapper';
import { ListPatientDriveQueryDto } from './list-patient-drive.query.dto';

@ApiTags('patient-files')
@Controller('v1/patients/:patientId/drive')
@RequirePermission('read', 'PatientFile')
export class ListPatientDriveRoute {
  constructor(private readonly listPatientDrive: ListPatientDriveUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar pastas e arquivos do drive do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientDriveQueryDto,
  ) {
    const result = await this.listPatientDrive.execute({
      storeId,
      patientId,
      folderId: query.folderId ?? null,
      search: query.search,
    });

    return {
      data: {
        folders: result.folders.map(toPatientFolderResponse),
        files: result.files.map(toPatientFileResponse),
      },
    };
  }
}
