import {
  BadRequestException,
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
import { UploadPatientPhotoUseCase } from '../../../../application/use-cases/upload-patient-photo/upload-patient-photo.use-case';
import { GetPatientPhotoUseCase } from '../../../../application/use-cases/get-patient-photo/get-patient-photo.use-case';
import { DeletePatientPhotoUseCase } from '../../../../application/use-cases/delete-patient-photo/delete-patient-photo.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientResponse } from '../shared/patient-response.mapper';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

@ApiTags('patients')
@Controller('v1/patients/:id/photo')
@RequirePermission('update', 'Patient')
export class PatientPhotoRoute {
  constructor(
    private readonly uploadPhoto: UploadPatientPhotoUseCase,
    private readonly getPhoto: GetPatientPhotoUseCase,
    private readonly deletePhoto: DeletePatientPhotoUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar foto do paciente' })
  async upload(
    @StoreId() storeId: string,
    @Param('id') patientId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem obrigatório');
    }

    const detail = await this.uploadPhoto.execute({
      storeId,
      patientId,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });
    return { data: toPatientResponse(detail) };
  }

  @Get()
  @ApiOperation({ summary: 'Obter foto do paciente' })
  async download(
    @StoreId() storeId: string,
    @Param('id') patientId: string,
    @Res() res: Response,
  ) {
    const { buffer, mimeType } = await this.getPhoto.execute({
      storeId,
      patientId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover foto do paciente' })
  async remove(@StoreId() storeId: string, @Param('id') patientId: string) {
    const detail = await this.deletePhoto.execute({ storeId, patientId });
    return { data: toPatientResponse(detail) };
  }
}
