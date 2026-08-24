import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { SendLeadDocumentWhatsAppUseCase } from '../../../../application/use-cases/send-lead-document-whatsapp/send-lead-document-whatsapp.use-case';
import { mapLeadToHttp } from '../shared/lead-response.mapper';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('v1/leads/:leadId/documents')
export class SendLeadDocumentWhatsAppRoute {
  constructor(
    private readonly getLeadById: GetLeadByIdUseCase,
    private readonly sendLeadDocumentWhatsApp: SendLeadDocumentWhatsAppUseCase,
  ) {}

  @Post(':documentId/send-whatsapp')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Lead')
  @ApiOperation({
    summary: 'Gera link público do documento e registra envio via WhatsApp',
  })
  async handle(
    @StoreId() storeId: string,
    @Param('leadId') leadId: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: PermissionUser,
    @CurrentImoveisScope() scope: ImoveisScope | undefined,
  ) {
    const existing = await this.getLeadById.execute({ storeId, id: leadId });
    assertCanAccessAgentResource({
      user,
      scope,
      resourceAgentId: existing.agentId,
      resourceAgentIds: existing.agentIds,
      context: 'lead',
    });
    const result = await this.sendLeadDocumentWhatsApp.execute({
      storeId,
      leadId,
      documentId,
    });
    return {
      data: {
        shareUrl: result.shareUrl,
        whatsappUrl: result.whatsappUrl,
        sentAt: result.sentAt.toISOString(),
        lead: mapLeadToHttp(result.lead),
      },
    };
  }
}
