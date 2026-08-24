import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { GetSignedPdfUseCase } from '../../../../application/use-cases/get-signed-pdf/get-signed-pdf.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('signatures')
@Controller('v1/patients/:patientId/signatures')
@RequirePermission('manage', 'Patient')
export class GetSignedPdfRoute {
  constructor(private readonly getSignedPdf: GetSignedPdfUseCase) {}

  @Get(':signatureId/signed-pdf')
  @ApiOperation({ summary: 'Baixar PDF assinado' })
  async handle(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('signatureId') signatureId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.getSignedPdf.execute({
      storeId,
      patientId,
      signatureId,
    });
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    return new StreamableFile(result.buffer);
  }
}
