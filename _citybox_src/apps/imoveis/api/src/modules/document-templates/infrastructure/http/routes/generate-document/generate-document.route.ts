import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { assertCanAccessAgentResource } from '../../../../../../shared/infra/http/auth/assert-can-access-agent-resource';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import { CurrentImoveisScope } from '../../../../../../shared/infra/http/decorators/imoveis-scope.decorator';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import {
  RequireAnyPermission,
  type PermissionUser,
} from '../../../../../../shared/infra/http/decorators/permissions';
import type { ImoveisScope } from '../../../../../../shared/infra/http/guards/imoveis-scope.guard';
import { DocumentMergeContextLoader } from '../../../../application/services/document-merge-context.loader';
import { GenerateDocumentUseCase } from '../../../../application/use-cases/generate-document/generate-document.use-case';
import {
  resolveDocumentContextIds,
} from '../../../../application/policies/document-context.policy';
import { DocumentGenerateDto } from '../shared/document-generate.dto';
import { mapGeneratedDocumentToHttp } from '../shared/generated-document-response.mapper';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('v1/documents')
export class GenerateDocumentRoute {
  constructor(
    private readonly generateDocument: GenerateDocumentUseCase,
    private readonly loader: DocumentMergeContextLoader,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @RequireAnyPermission(
    { action: 'manage', subject: 'Lead' },
    { action: 'manage', subject: 'Calendar' },
    { action: 'manage', subject: 'Transaction' },
  )
  @ApiOperation({ summary: 'Gerar PDF a partir de um modelo' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: DocumentGenerateDto,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    const resolved = resolveDocumentContextIds(dto, GenerateDocumentRoute.name);
    const loaded = await this.loader.load(storeId, resolved, user.sub);
    assertCanAccessAgentResource({
      user,
      scope,
      resourceAgentId: loaded.resourceAgentId,
      resourceAgentIds: loaded.resourceAgentIds,
      context: 'document',
    });
    const result = await this.generateDocument.execute({
      storeId,
      templateId: dto.templateId,
      leadId: dto.leadId,
      appointmentId: dto.appointmentId,
      transactionId: dto.transactionId,
      kind: dto.kind,
      actorAgentId: user.sub,
    });
    return {
      data: mapGeneratedDocumentToHttp(result.document, result.leadDocumentId),
    };
  }
}
