import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientMoveDestinationsUseCase } from '../../../../application/use-cases/list-patient-move-destinations/list-patient-move-destinations.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListPatientMoveDestinationsQueryDto } from './list-patient-move-destinations.query.dto';

@ApiTags('patient-files')
@Controller('v1/patients/:patientId/drive')
@RequirePermission('update', 'PatientFile')
export class ListPatientMoveDestinationsRoute {
  constructor(
    private readonly listPatientMoveDestinations: ListPatientMoveDestinationsUseCase,
  ) {}

  @Get('move-destinations')
  @ApiOperation({ summary: 'Listar destinos para mover pasta ou arquivo' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientMoveDestinationsQueryDto,
  ) {
    const excludeFolderIds = query.excludeFolderIds
      ? query.excludeFolderIds
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    const data = await this.listPatientMoveDestinations.execute({
      storeId,
      patientId,
      excludeFolderIds,
      excludeFolderSubtreeId: query.excludeFolderSubtreeId,
    });

    return { data };
  }
}
