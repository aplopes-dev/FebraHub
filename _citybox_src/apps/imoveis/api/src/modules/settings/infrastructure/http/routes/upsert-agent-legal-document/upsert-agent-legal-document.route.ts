import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Put,
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
import { UpsertAgentLegalDocumentUseCase } from '../../../../application/use-cases/upsert-agent-legal-document/upsert-agent-legal-document.use-case';
import { UpsertAgentLegalDocumentPresenter } from './upsert-agent-legal-document.presenter';

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
@Controller('v1/settings/profile/:agentId/legal-documents')
export class UpsertAgentLegalDocumentRoute {
  constructor(
    private readonly upsertAgentLegalDocument: UpsertAgentLegalDocumentUseCase,
  ) {}

  @Put(':kind')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: DocumentFileValidator.maxBytes },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar documento legal do corretor (multipart)' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Param('kind') kind: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @UploadedFile() file?: Express.Multer.File,
    @Body('name') name?: string,
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
    const profile = await this.upsertAgentLegalDocument.execute({
      storeId,
      agentId,
      kind,
      buffer: file.buffer,
      filename: resolveFilename(file.originalname, name),
    });
    return UpsertAgentLegalDocumentPresenter.toHttp(profile);
  }
}
