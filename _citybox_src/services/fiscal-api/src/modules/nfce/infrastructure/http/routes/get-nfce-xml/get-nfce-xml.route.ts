import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetNfeXmlUseCase } from '../../../../../nfe/application/use-cases/get-nfe-xml/get-nfe-xml.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

/// `GET /api/v1/nfce/{id}/xml` — XML autorizado do cupom.
///
/// ⚠️ **É por aqui que se confere o QR Code**, e é a única forma de fazê-lo: o
/// conteúdo vive em `infNFeSupl/qrCode` **dentro do XML**, não na resposta da
/// emissão nem no PDF. Um cupom autorizado sem QR Code é inconsultável pelo
/// consumidor, e nada além deste endpoint denuncia.
///
/// Reusa `GetNfeXmlUseCase`, que já é genérico por `FiscalDocument`.
///
/// ⚠️ `Content-Type` setado **depois** do `execute()`, não por `@Header()`: o
/// Nest aplica os headers do decorator antes de invocar o handler, então uma
/// resposta de erro sairia rotulada como XML e o cliente nunca chegaria ao
/// `error.code`. Mesma razão documentada em `get-danfe.route.ts` — a rota
/// equivalente de NF-e ainda usa `@Header()` e tem esse defeito.
@ApiTags('nfce')
@Controller('v1/nfce')
@RequirePermission('fiscal.documents.view')
export class GetNfceXmlRoute {
  constructor(private readonly getNfceXml: GetNfeXmlUseCase) {}

  @Get(':id/xml')
  @ApiOperation({
    summary: 'Baixar o XML autorizado do cupom fiscal',
    description:
      'Use este endpoint para conferir o QR Code em infNFeSupl — ele não aparece na resposta da emissão.',
  })
  async handle(
    @Param('id') id: string,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.getNfceXml.execute({ fiscalDocumentId: id });

    response.setHeader('Content-Type', 'application/xml');
    response.end(result.buffer);
  }
}
