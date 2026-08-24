import { Controller, Get, Header, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetNfeXmlUseCase } from '../../../../application/use-cases/get-nfe-xml/get-nfe-xml.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('nfe')
@Controller('v1/nfe')
@RequirePermission('fiscal.documents.view')
export class GetNfeXmlRoute {
  constructor(private readonly getNfeXml: GetNfeXmlUseCase) {}

  @Get(':id/xml')
  @Header('Content-Type', 'application/xml')
  @ApiOperation({ summary: 'Baixar o XML autorizado de uma NF-e' })
  async handle(@Param('id') id: string): Promise<string> {
    const result = await this.getNfeXml.execute({ fiscalDocumentId: id });
    return result.buffer.toString('utf-8');
  }
}
