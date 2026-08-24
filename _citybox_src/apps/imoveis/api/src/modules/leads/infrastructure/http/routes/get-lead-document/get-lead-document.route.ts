import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { assertCanAccessAgentResource } from '../../../../../../shared/infra/http/auth/assert-can-access-agent-resource';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequirePermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { GetLeadByIdUseCase } from '../../../../application/use-cases/get-lead-by-id/get-lead-by-id.use-case';
import { GetLeadDocumentUseCase } from '../../../../application/use-cases/get-lead-document/get-lead-document.use-case';

function contentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '');
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/leads/:leadId/documents')
export class GetLeadDocumentRoute {
  constructor(
    private readonly getLeadById: GetLeadByIdUseCase,
    private readonly getLeadDocument: GetLeadDocumentUseCase,
  ) {}

  @Get(':documentId')
  @RequirePermission('read', 'Lead')
  @ApiOperation({ summary: 'Obter bytes do documento do lead' })
  async handle(
    @StoreId() storeId: string,
    @Param('leadId') leadId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Res() res: Response,
  ) {
    const lead = await this.getLeadById.execute({ storeId, id: leadId });
    assertCanAccessAgentResource({
      user,
      scope,
      resourceAgentId: lead.agentId,
      resourceAgentIds: lead.agentIds,
      context: 'lead',
    });
    const { buffer, mimeType, name } = await this.getLeadDocument.execute({
      storeId,
      leadId,
      documentId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', contentDisposition(name));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }
}
