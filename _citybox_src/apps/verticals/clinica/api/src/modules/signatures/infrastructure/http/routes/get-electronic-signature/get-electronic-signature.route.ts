import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetElectronicSignatureUseCase } from '../../../../application/use-cases/get-electronic-signature/get-electronic-signature.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toElectronicSignatureResponse } from '../shared/electronic-signature-response.mapper';

@ApiTags('signatures')
@Controller('v1/patients/:patientId/signatures')
@RequirePermission('manage', 'Patient')
export class GetElectronicSignatureRoute {
  constructor(
    private readonly getElectronicSignature: GetElectronicSignatureUseCase,
  ) {}

  @Get(':signatureId')
  @ApiOperation({ summary: 'Detalhar solicitação de assinatura eletrônica' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('signatureId') signatureId: string,
  ) {
    const signature = await this.getElectronicSignature.execute({
      storeId,
      patientId,
      signatureId,
    });
    return { data: toElectronicSignatureResponse(signature) };
  }
}
