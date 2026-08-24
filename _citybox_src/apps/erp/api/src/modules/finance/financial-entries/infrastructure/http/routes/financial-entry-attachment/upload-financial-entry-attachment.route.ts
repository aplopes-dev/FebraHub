import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UploadFinancialEntryAttachmentUseCase } from '../../../../application/use-cases/upload-financial-entry-attachment/upload-financial-entry-attachment.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { FinancialEntryAttachmentPresenter } from '../shared/financial-entry-attachment.presenter';

/** D14 de research.md — 5MB por arquivo. */
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

@ApiTags('financial-entries')
@Controller('v1/financial-entries/:id/attachments')
export class UploadFinancialEntryAttachmentRoute {
  constructor(
    private readonly uploadAttachment: UploadFinancialEntryAttachmentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('store.finance.manage')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Anexar comprovante ao lançamento' })
  @ApiResponse({ status: 201, description: 'Anexo criado' })
  @ApiResponse({
    status: 422,
    description:
      'Arquivo maior que 5MB ou fora dos tipos permitidos (PDF/imagem)',
  })
  @ApiResponse({ status: 404, description: 'Lançamento não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório');
    }
    const attachment = await this.uploadAttachment.execute({
      organizationId,
      financialEntryId: id,
      fileName: file.originalname,
      buffer: file.buffer,
      declaredMimeType: file.mimetype,
    });
    return FinancialEntryAttachmentPresenter.toHttpSingle(attachment);
  }
}
