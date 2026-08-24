import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConsultNfeUseCase } from '../../../../../nfe/application/use-cases/consult-nfe/consult-nfe.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../../../../../fiscal-documents/infrastructure/http/routes/shared/fiscal-document.presenter';

/// `GET /api/v1/nfce/{id}`.
///
/// Reusa `ConsultNfeUseCase` sem adaptação: ele já opera sobre `FiscalDocument`
/// e consulta o órgão pelo provider gravado no próprio documento — nada nele é
/// específico do modelo 55. Criar um caso de uso paralelo só duplicaria a
/// máquina de estados, que é onde os erros custam caro.
@ApiTags('nfce')
@Controller('v1/nfce')
@RequirePermission('fiscal.documents.view')
export class GetNfceRoute {
  constructor(private readonly consultNfce: ConsultNfeUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Consultar situação de um cupom fiscal (NFC-e)' })
  async handle(@Param('id') id: string) {
    const document = await this.consultNfce.execute({ fiscalDocumentId: id });
    return FiscalDocumentPresenter.toHttp(document);
  }
}
