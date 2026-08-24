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
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { DocumentFileValidator } from '../../../../../properties/application/validators/document-file.validator';
import { UploadAgentDocumentUseCase } from '../../../../application/use-cases/upload-agent-document/upload-agent-document.use-case';
import { UploadAgentDocumentPresenter } from './upload-agent-document.presenter';

/**
 * Busboy decodifica `filename` do multipart como latin1; o campo `name` (utf8)
 * é a fonte preferida para preservar acentos.
 */
function resolveFilename(originalName: string, providedName?: string): string {
  if (providedName?.trim()) return providedName.trim();
  return Buffer.from(originalName, 'latin1').toString('utf8');
}

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/documents')
export class UploadAgentDocumentRoute {
  constructor(
    private readonly uploadAgentDocument: UploadAgentDocumentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: DocumentFileValidator.maxBytes },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar documento para uma pasta (multipart)' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Body('folderId') folderId?: string,
    @Body('detailsLabel') detailsLabel?: string,
    @Body('status') status?: string,
    @Body('name') name?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'write',
    });
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório');
    }
    if (!folderId?.trim()) {
      throw new BadRequestException('folderId obrigatório');
    }
    const document = await this.uploadAgentDocument.execute({
      storeId,
      agentId,
      folderId: folderId.trim(),
      buffer: file.buffer,
      filename: resolveFilename(file.originalname, name),
      detailsLabel,
      status,
    });
    return UploadAgentDocumentPresenter.toHttp(document);
  }
}
