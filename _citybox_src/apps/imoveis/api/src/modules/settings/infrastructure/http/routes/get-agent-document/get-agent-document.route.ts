import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { GetAgentDocumentUseCase } from '../../../../application/use-cases/get-agent-document/get-agent-document.use-case';
import { contentDisposition } from '../shared/binary-response';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/documents')
export class GetAgentDocumentRoute {
  constructor(private readonly getAgentDocument: GetAgentDocumentUseCase) {}

  @Get(':documentId')
  @ApiOperation({ summary: 'Obter bytes de um documento da pasta' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Param('documentId') documentId: string,
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
    const { buffer, mimeType, name } = await this.getAgentDocument.execute({
      storeId,
      agentId,
      documentId,
    });
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', contentDisposition(name));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buffer);
  }
}
