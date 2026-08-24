import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MovePatientFolderUseCase } from '../../../../application/use-cases/move-patient-folder/move-patient-folder.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientFolderResponse } from '../shared/patient-file-response.mapper';
import { MovePatientFolderBodyDto } from './move-patient-folder.body.dto';

@ApiTags('patient-files')
@Controller('v1/patients/:patientId/folders')
@RequirePermission('update', 'PatientFile')
export class MovePatientFolderRoute {
  constructor(private readonly movePatientFolder: MovePatientFolderUseCase) {}

  @Patch(':folderId/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mover pasta no drive do paciente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('folderId') folderId: string,
    @Body() body: MovePatientFolderBodyDto,
  ) {
    const folder = await this.movePatientFolder.execute({
      storeId,
      patientId,
      folderId,
      parentId: body.parentId ?? null,
    });

    return { data: toPatientFolderResponse(folder) };
  }
}
