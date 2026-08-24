import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UploadPatientFinancialEntryAttachmentUseCase } from '../../../../application/use-cases/upload-patient-financial-entry-attachment/upload-patient-financial-entry-attachment.use-case';
import { DeletePatientFinancialEntryAttachmentUseCase } from '../../../../application/use-cases/delete-patient-financial-entry-attachment/delete-patient-financial-entry-attachment.use-case';
import { GetPatientFinancialEntryAttachmentUseCase } from '../../../../application/use-cases/get-patient-financial-entry-attachment/get-patient-financial-entry-attachment.use-case';
import { PATIENT_FILE_MAX_SIZE_BYTES } from '../../../../../patient-files/application/validators/patient-file-mime.validator';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientFinancialEntryDetailResponse } from '../shared/patient-financial-entry-response.mapper';
import { ValidatorDomainError } from '../../../../../../../shared/core/errors/validator-domain.error';

const attachmentInterceptor = FileInterceptor('file', {
  limits: { fileSize: PATIENT_FILE_MAX_SIZE_BYTES },
});

@ApiTags('patient-financial-entries')
@Controller('v1/patients/:patientId/financial-entries/:entryId/attachments')
@RequirePermission('manage', 'Patient')
export class PatientFinancialEntryAttachmentRoute {
  constructor(
    private readonly uploadAttachment: UploadPatientFinancialEntryAttachmentUseCase,
    private readonly deleteAttachment: DeletePatientFinancialEntryAttachmentUseCase,
    private readonly getAttachment: GetPatientFinancialEntryAttachmentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(attachmentInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Anexar documento ao débito pendente' })
  async upload(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('entryId') entryId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new ValidatorDomainError({
        internalMessage: 'Missing attachment file',
        externalMessage: 'Selecione um arquivo para anexar',
        context: PatientFinancialEntryAttachmentRoute.name,
      });
    }

    const entry = await this.uploadAttachment.execute({
      storeId,
      patientId,
      entryId,
      name: file.originalname,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });

    return { data: toPatientFinancialEntryDetailResponse(entry) };
  }

  @Get(':attachmentId')
  @ApiOperation({ summary: 'Baixar anexo do débito' })
  async download(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('entryId') entryId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response,
  ) {
    const content = await this.getAttachment.execute({
      storeId,
      patientId,
      entryId,
      attachmentId,
    });

    res.setHeader('Content-Type', content.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(content.name)}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(content.buffer);
  }

  @Delete(':attachmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover anexo do débito pendente' })
  async remove(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('entryId') entryId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    const entry = await this.deleteAttachment.execute({
      storeId,
      patientId,
      entryId,
      attachmentId,
    });

    return { data: toPatientFinancialEntryDetailResponse(entry) };
  }
}
