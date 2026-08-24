import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListPatientNutritionNotesUseCase } from '../../../../application/use-cases/nutrition-notes/list-patient-nutrition-notes.use-case';
import { SavePatientNutritionNoteUseCase } from '../../../../application/use-cases/nutrition-notes/save-patient-nutrition-note.use-case';
import { PATIENT_FILE_MAX_SIZE_BYTES } from '../../../../../patient-files/application/validators/patient-file-mime.validator';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../../shared/infra/http/decorators/store-id.decorator';
import { SavePatientNutritionNoteBodyDto } from './patient-nutrition-note.body.dto';
import { toPatientNutritionNoteResponse } from './patient-nutrition-note-response.mapper';

const attachmentInterceptor = FileInterceptor('file', {
  limits: { fileSize: PATIENT_FILE_MAX_SIZE_BYTES },
});

/** Notas do atendimento nutricional — criar e editar; sem exclusão por design. */
@ApiTags('patient-treatments')
@Controller('v1/patients/:patientId/nutrition-inits/:evolutionId/notes')
@RequirePermission('manage', 'PatientTreatment')
export class PatientNutritionNoteRoute {
  constructor(
    private readonly listNotes: ListPatientNutritionNotesUseCase,
    private readonly saveNote: SavePatientNutritionNoteUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar notas do atendimento nutricional' })
  async list(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('evolutionId') evolutionId: string,
  ) {
    const notes = await this.listNotes.execute({
      storeId,
      patientId,
      evolutionId,
    });
    return { data: notes.map(toPatientNutritionNoteResponse) };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(attachmentInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Adicionar nota ao atendimento nutricional' })
  async create(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('evolutionId') evolutionId: string,
    @Body() body: SavePatientNutritionNoteBodyDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const note = await this.saveNote.execute({
      storeId,
      patientId,
      evolutionId,
      content: body.content,
      professionalId: body.professionalId ?? null,
      professionalName: body.professionalName,
      attachment: file
        ? {
            name: file.originalname,
            buffer: file.buffer,
            declaredMimeType: file.mimetype,
          }
        : null,
    });

    return { data: toPatientNutritionNoteResponse(note) };
  }

  @Patch(':noteId')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(attachmentInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Editar nota do atendimento nutricional' })
  async update(
    @StoreId() storeId: string,
    @Param('patientId') patientId: string,
    @Param('evolutionId') evolutionId: string,
    @Param('noteId') noteId: string,
    @Body() body: SavePatientNutritionNoteBodyDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const note = await this.saveNote.execute({
      storeId,
      patientId,
      evolutionId,
      noteId,
      content: body.content,
      professionalId: body.professionalId ?? null,
      professionalName: body.professionalName,
      attachment: file
        ? {
            name: file.originalname,
            buffer: file.buffer,
            declaredMimeType: file.mimetype,
          }
        : null,
    });

    return { data: toPatientNutritionNoteResponse(note) };
  }
}
