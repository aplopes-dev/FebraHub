import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListNfseEventsUseCase } from '../../../../application/use-cases/list-nfse-events/list-nfse-events.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('nfse')
@Controller('v1/nfse')
// `fiscal.documents.view` — achado da auditoria de permissões (spec erp/023,
// N1): `fiscal.documents.read` não existe em nenhum papel, mesma classe de
// erro que quebrou a escrita de séries. Toda outra rota GET usa `.view`.
@RequirePermission('fiscal.documents.view')
export class ListNfseEventsRoute {
  constructor(private readonly listEvents: ListNfseEventsUseCase) {}

  @Get(':id/events')
  @ApiOperation({
    summary: 'Linha do tempo da NFS-e (FR-014)',
    description:
      'Devolve os eventos em ordem cronológica, fundindo o que esta API ' +
      'registrou com o que o ambiente nacional reporta.\n\n' +
      'Cada entrada traz `origin`: `LOCAL` para eventos que emitimos, `REMOTE` ' +
      'para os que só existem no órgão — tipicamente **eventos de ofício do ' +
      'município**. A distinção importa: "o município cancelou sua nota" e ' +
      '"você cancelou sua nota" são fatos diferentes.\n\n' +
      'Se o ambiente nacional estiver indisponível, a resposta sai apenas com ' +
      'os eventos locais em vez de falhar.',
  })
  async handle(@Param('id') id: string) {
    return this.listEvents.execute({ fiscalDocumentId: id });
  }
}
