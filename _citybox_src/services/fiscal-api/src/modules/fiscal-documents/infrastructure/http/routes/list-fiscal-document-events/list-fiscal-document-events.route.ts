import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListFiscalDocumentEventsUseCase } from '../../../../application/use-cases/list-fiscal-document-events/list-fiscal-document-events.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../shared/fiscal-document.presenter';

@ApiTags('fiscal-documents')
@Controller('v1/fiscal-documents')
@RequirePermission('fiscal.documents.view')
export class ListFiscalDocumentEventsRoute {
  constructor(
    private readonly listFiscalDocumentEvents: ListFiscalDocumentEventsUseCase,
  ) {}

  @Get(':id/events')
  @ApiOperation({
    summary:
      'Histórico de eventos (cancelamento, carta de correção, inutilização) de um documento fiscal',
  })
  async handle(@Param('id') id: string) {
    const events = await this.listFiscalDocumentEvents.execute({
      fiscalDocumentId: id,
    });
    return FiscalDocumentPresenter.toEventsHttp(events);
  }
}
