import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientSignaturesUseCase } from '../../../../application/use-cases/list-patient-signatures/list-patient-signatures.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toElectronicSignatureResponse } from '../shared/electronic-signature-response.mapper';
import { ListPatientSignaturesQueryDto } from './list-patient-signatures.query.dto';

@ApiTags('signatures')
@Controller('v1/patients/:patientId/signatures')
@RequirePermission('manage', 'Patient')
export class ListPatientSignaturesRoute {
  constructor(
    private readonly listPatientSignatures: ListPatientSignaturesUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar assinaturas eletrônicas do paciente (ficha)',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Query() query: ListPatientSignaturesQueryDto,
  ) {
    const result = await this.listPatientSignatures.execute({
      storeId,
      patientId,
      status: query.status,
      page: query.page,
      perPage: query.perPage,
    });

    return {
      data: result.items.map(toElectronicSignatureResponse),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}
