import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { GetAgentLegalDocumentUseCase } from '../../../../application/use-cases/get-agent-legal-document/get-agent-legal-document.use-case';
import { contentDisposition } from '../shared/binary-response';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/legal-documents')
export class GetAgentLegalDocumentRoute {
  constructor(
    private readonly getAgentLegalDocument: GetAgentLegalDocumentUseCase,
  ) {}

  @Get(':kind')
  @ApiOperation({ summary: 'Obter bytes do documento legal do corretor' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Param('kind') kind: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Res() res: Response,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'read',
    });
    const { buffer, mimeType, name } = await this.getAgentLegalDocument.execute(
      { storeId, agentId, kind },
    );
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', contentDisposition(name));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }
}
