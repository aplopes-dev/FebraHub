import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetNfeXmlUseCase } from '../../../../../nfe/application/use-cases/get-nfe-xml/get-nfe-xml.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

/// Reaproveita `GetNfeXmlUseCase` — a lógica (buscar `xmlObjectKey` do
/// `FiscalDocument` no `ObjectStorage`) é genérica por `fiscalDocumentId`,
/// sem nada específico de NF-e (FR-010).
@ApiTags('nfse')
@Controller('v1/nfse')
@RequirePermission('fiscal.documents.view')
export class GetNfseXmlRoute {
  constructor(private readonly getNfseXml: GetNfeXmlUseCase) {}

  @Get(':id/xml')
  @Header('Content-Type', 'application/xml')
  @ApiOperation({ summary: 'Baixar o XML/DPS autorizado de uma NFS-e' })
  async handle(@Param('id') id: string): Promise<string> {
    const result = await this.getNfseXml.execute({ fiscalDocumentId: id });
    return result.buffer.toString('utf-8');
  }
}
