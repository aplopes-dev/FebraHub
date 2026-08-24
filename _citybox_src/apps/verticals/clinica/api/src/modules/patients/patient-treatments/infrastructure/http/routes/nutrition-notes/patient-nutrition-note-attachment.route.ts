import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { GetPatientNutritionNoteAttachmentUseCase } from '../../../../application/use-cases/nutrition-notes/get-patient-nutrition-note-attachment.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('patient-treatments')
@Controller('v1/patients/:patientId/nutrition-notes')
@RequirePermission('manage', 'PatientTreatment')
export class PatientNutritionNoteAttachmentRoute {
  constructor(
    private readonly getAttachment: GetPatientNutritionNoteAttachmentUseCase,
  ) {}

  @Get(':noteId/content')
  @ApiOperation({ summary: 'Baixar anexo da nota do atendimento nutricional' })
  async download(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('noteId') noteId: string,
    @Res() res: Response,
  ) {
    const content = await this.getAttachment.execute({
      storeId,
      patientId,
      noteId,
    });

    res.setHeader('Content-Type', content.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(content.name)}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(content.buffer);
  }
}
