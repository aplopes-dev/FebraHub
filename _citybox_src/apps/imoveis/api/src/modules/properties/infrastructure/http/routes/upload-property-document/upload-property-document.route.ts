import {
  BadRequestException,
  Body,
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
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { UploadPropertyDocumentUseCase } from '../../../../application/use-cases/upload-property-document/upload-property-document.use-case';
import { DocumentFileValidator } from '../../../../application/validators/document-file.validator';
import { UploadPropertyDocumentPresenter } from './upload-property-document.presenter';

/**
 * Busboy decodifica `filename` do multipart como latin1; o campo `name` (utf8)
 * é a fonte preferida para preservar acentos.
 */
function resolveFilename(originalName: string, providedName?: string): string {
  if (providedName?.trim()) return providedName.trim();
  return Buffer.from(originalName, 'latin1').toString('utf8');
}

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties/:propertyId/documents')
export class UploadPropertyDocumentRoute {
  constructor(
    private readonly uploadPropertyDocument: UploadPropertyDocumentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Property')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: DocumentFileValidator.maxBytes },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar documento do imóvel (multipart)' })
  async handle(
    @StoreId() storeId: string,
    @Param('propertyId') propertyId: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body('name') name?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório');
    }
    const property = await this.uploadPropertyDocument.execute({
      storeId,
      propertyId,
      buffer: file.buffer,
      filename: resolveFilename(file.originalname, name),
    });
    return UploadPropertyDocumentPresenter.toHttp(property);
  }
}
