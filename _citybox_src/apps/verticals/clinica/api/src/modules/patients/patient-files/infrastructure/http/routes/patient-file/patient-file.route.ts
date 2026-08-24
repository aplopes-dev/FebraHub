import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UploadPatientFileUseCase } from '../../../../application/use-cases/upload-patient-file/upload-patient-file.use-case';
import { GetPatientFileContentUseCase } from '../../../../application/use-cases/get-patient-file-content/get-patient-file-content.use-case';
import { DeletePatientFileUseCase } from '../../../../application/use-cases/delete-patient-file/delete-patient-file.use-case';
import { RenamePatientFileUseCase } from '../../../../application/use-cases/rename-patient-file/rename-patient-file.use-case';
import { MovePatientFileUseCase } from '../../../../application/use-cases/move-patient-file/move-patient-file.use-case';
import { PATIENT_FILE_MAX_SIZE_BYTES } from '../../../../application/validators/patient-file-mime.validator';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { toPatientFileResponse } from '../shared/patient-file-response.mapper';
import { MovePatientFileBodyDto } from './move-patient-file.body.dto';
import { RenamePatientFileBodyDto } from './rename-patient-file.body.dto';
import { UploadPatientFileBodyDto } from './upload-patient-file.body.dto';

@ApiTags('patient-files')
@Controller('v1/patients/:patientId/files')
export class PatientFileRoute {
  constructor(
    private readonly uploadPatientFile: UploadPatientFileUseCase,
    private readonly getPatientFileContent: GetPatientFileContentUseCase,
    private readonly renamePatientFile: RenamePatientFileUseCase,
    private readonly movePatientFile: MovePatientFileUseCase,
    private readonly deletePatientFile: DeletePatientFileUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('create', 'PatientFile')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: PATIENT_FILE_MAX_SIZE_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar arquivo para o drive do paciente' })
  async upload(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadPatientFileBodyDto,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório');
    }

    const saved = await this.uploadPatientFile.execute({
      storeId,
      patientId,
      folderId: body.folderId ?? null,
      name: file.originalname,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });

    return { data: toPatientFileResponse(saved) };
  }

  @Get(':fileId/content')
  @RequirePermission('read', 'PatientFile')
  @ApiOperation({ summary: 'Obter conteúdo do arquivo do paciente' })
  async download(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const content = await this.getPatientFileContent.execute({
      storeId,
      patientId,
      fileId,
    });

    res.setHeader('Content-Type', content.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(content.name)}"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(content.buffer);
  }

  @Patch(':fileId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('update', 'PatientFile')
  @ApiOperation({ summary: 'Renomear arquivo do drive do paciente' })
  async rename(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('fileId') fileId: string,
    @Body() body: RenamePatientFileBodyDto,
  ) {
    const saved = await this.renamePatientFile.execute({
      storeId,
      patientId,
      fileId,
      name: body.name,
    });

    return { data: toPatientFileResponse(saved) };
  }

  @Patch(':fileId/move')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('update', 'PatientFile')
  @ApiOperation({ summary: 'Mover arquivo no drive do paciente' })
  async move(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('fileId') fileId: string,
    @Body() body: MovePatientFileBodyDto,
  ) {
    const saved = await this.movePatientFile.execute({
      storeId,
      patientId,
      fileId,
      folderId: body.folderId ?? null,
    });

    return { data: toPatientFileResponse(saved) };
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('delete', 'PatientFile')
  @ApiOperation({ summary: 'Excluir arquivo do drive do paciente' })
  async remove(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('fileId') fileId: string,
  ) {
    await this.deletePatientFile.execute({
      storeId,
      patientId,
      fileId,
    });
  }
}
