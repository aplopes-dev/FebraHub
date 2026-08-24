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
import { assertCanAccessAgentResource } from '../../../../../../shared/infra/http/auth/assert-can-access-agent-resource';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { DocumentFileValidator } from '../../../../../properties/application/validators/document-file.validator';
import { GetLeadByIdUseCase } from '../../../../application/use-cases/get-lead-by-id/get-lead-by-id.use-case';
import { UploadLeadDocumentUseCase } from '../../../../application/use-cases/upload-lead-document/upload-lead-document.use-case';
import { mapLeadToHttp } from '../shared/lead-response.mapper';

function resolveFilename(originalName: string, providedName?: string): string {
  if (providedName?.trim()) return providedName.trim();
  return Buffer.from(originalName, 'latin1').toString('utf8');
}

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/leads/:leadId/documents')
export class UploadLeadDocumentRoute {
  constructor(
    private readonly getLeadById: GetLeadByIdUseCase,
    private readonly uploadLeadDocument: UploadLeadDocumentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission('manage', 'Lead')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: DocumentFileValidator.maxBytes },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Enviar documento do lead (multipart)' })
  async handle(
    @StoreId() storeId: string,
    @Param('leadId') leadId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @UploadedFile() file?: Express.Multer.File,
    @Body('name') name?: string,
    @Body('kind') kind?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo obrigatório');
    }
    const existing = await this.getLeadById.execute({ storeId, id: leadId });
    assertCanAccessAgentResource({
      user,
      scope,
      resourceAgentId: existing.agentId,
      resourceAgentIds: existing.agentIds,
      context: 'lead',
    });
    const lead = await this.uploadLeadDocument.execute({
      storeId,
      leadId,
      buffer: file.buffer,
      filename: resolveFilename(file.originalname, name),
      kind: kind === 'contract' ? 'contract' : 'other',
    });
    return { data: mapLeadToHttp(lead) };
  }
}
