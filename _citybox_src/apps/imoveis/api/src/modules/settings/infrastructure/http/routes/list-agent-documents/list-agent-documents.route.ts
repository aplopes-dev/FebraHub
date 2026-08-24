import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { ListAgentDocumentsUseCase } from '../../../../application/use-cases/list-agent-documents/list-agent-documents.use-case';
import { ListAgentDocumentsPresenter } from './list-agent-documents.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/documents')
export class ListAgentDocumentsRoute {
  constructor(private readonly listAgentDocuments: ListAgentDocumentsUseCase) {}

  @Get()
  @ApiQuery({ name: 'folderId', required: false })
  @ApiOperation({ summary: 'Listar documentos das pastas do corretor' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
    @Query('folderId') folderId?: string,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'read',
    });
    const documents = await this.listAgentDocuments.execute({
      storeId,
      agentId,
      folderId,
    });
    return ListAgentDocumentsPresenter.toHttp(documents);
  }
}
