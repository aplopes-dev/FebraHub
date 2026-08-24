import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CancelElectronicSignatureUseCase } from '../../../../application/use-cases/cancel-electronic-signature/cancel-electronic-signature.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toElectronicSignatureResponse } from '../shared/electronic-signature-response.mapper';

@ApiTags('signatures')
@Controller('v1/patients/:patientId/signatures')
@RequirePermission('manage', 'Patient')
export class CancelElectronicSignatureRoute {
  constructor(
    private readonly cancelElectronicSignature: CancelElectronicSignatureUseCase,
  ) {}

  @Post(':signatureId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar solicitação de assinatura pendente' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('signatureId') signatureId: string,
  ) {
    const signature = await this.cancelElectronicSignature.execute({
      storeId,
      patientId,
      signatureId,
    });
    return { data: toElectronicSignatureResponse(signature) };
  }
}
