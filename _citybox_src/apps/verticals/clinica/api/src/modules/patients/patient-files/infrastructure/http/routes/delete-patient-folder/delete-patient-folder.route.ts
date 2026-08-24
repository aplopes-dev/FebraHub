import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePatientFolderUseCase } from '../../../../application/use-cases/delete-patient-folder/delete-patient-folder.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-files')
@Controller('v1/patients/:patientId/folders')
@RequirePermission('delete', 'PatientFile')
export class DeletePatientFolderRoute {
  constructor(
    private readonly deletePatientFolder: DeletePatientFolderUseCase,
  ) {}

  @Delete(':folderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir pasta do drive do paciente (recursivo)' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('folderId') folderId: string,
  ) {
    await this.deletePatientFolder.execute({
      storeId,
      patientId,
      folderId,
    });
  }
}
