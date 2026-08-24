import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { authorizeAgentProfileAccess } from '../../../../../../shared/infra/http/auth/authorize-agent-profile-access';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import type { PermissionUser } from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { UpdateAgentDocumentUseCase } from '../../../../application/use-cases/update-agent-document/update-agent-document.use-case';
import { UpdateAgentDocumentDto } from './update-agent-document.dto';
import { UpdateAgentDocumentPresenter } from './update-agent-document.presenter';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('v1/settings/profile/:agentId/documents')
export class UpdateAgentDocumentRoute {
  constructor(
    private readonly updateAgentDocument: UpdateAgentDocumentUseCase,
  ) {}

  @Patch(':documentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar status/descrição de um documento' })
  async handle(
    @StoreId() storeId: string,
    @Param('agentId') agentId: string,
    @Param('documentId') documentId: string,
    @Body() dto: UpdateAgentDocumentDto,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    authorizeAgentProfileAccess({
      user,
      scope,
      targetAgentId: agentId,
      mode: 'write',
    });
    const document = await this.updateAgentDocument.execute({
      storeId,
      agentId,
      documentId,
      status: dto.status,
      detailsLabel: dto.detailsLabel,
    });
    return UpdateAgentDocumentPresenter.toHttp(document);
  }
}
