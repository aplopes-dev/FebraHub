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
import { DeleteAgentDocumentUseCase } from '../../../../application/use-cases/delete-agent-document/delete-agent-document.use-case';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/documents')
export class DeleteAgentDocumentRoute {
  constructor(
    private readonly deleteAgentDocument: DeleteAgentDocumentUseCase,
  ) {}

  @Delete(':documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover documento da pasta' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'write',
    });
    await this.deleteAgentDocument.execute({ storeId, agentId, documentId });
  }
}
