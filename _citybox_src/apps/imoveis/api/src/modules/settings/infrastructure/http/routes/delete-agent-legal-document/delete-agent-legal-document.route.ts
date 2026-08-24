import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { DeleteAgentLegalDocumentUseCase } from '../../../../application/use-cases/delete-agent-legal-document/delete-agent-legal-document.use-case';
import { DeleteAgentLegalDocumentPresenter } from './delete-agent-legal-document.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/legal-documents')
export class DeleteAgentLegalDocumentRoute {
  constructor(
    private readonly deleteAgentLegalDocument: DeleteAgentLegalDocumentUseCase,
  ) {}

  @Delete(':kind')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover documento legal do corretor' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Param('kind') kind: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'write',
    });
    const profile = await this.deleteAgentLegalDocument.execute({
      storeId,
      agentId,
      kind,
    });
    return DeleteAgentLegalDocumentPresenter.toHttp(profile);
  }
}
