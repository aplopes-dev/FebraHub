import type { FiscalDocumentType } from '../../../../domain/entities/fiscal-document.entity';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GetFiscalDocumentsSummaryUseCase } from '../../../../application/use-cases/get-fiscal-documents-summary/get-fiscal-documents-summary.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentSummaryPresenter } from '../shared/fiscal-document-summary.presenter';

/// ⚠️ Rota literal (`/summary`) — precisa vir registrada ANTES de
/// `GetFiscalDocumentRoute` (`GET /v1/fiscal-documents/:id`) na ordem de
/// `controllers` do módulo, senão o Nest casa "summary" como `:id` primeiro.
/// Ver `fiscal-documents.module.ts`.
@ApiTags('fiscal-documents')
@Controller('v1/fiscal-documents')
@RequirePermission('fiscal.documents.view')
export class GetFiscalDocumentsSummaryRoute {
  constructor(
    private readonly getFiscalDocumentsSummary: GetFiscalDocumentsSummaryUseCase,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary:
      'Totais por status (Total/Autorizadas/Canceladas) dos documentos fiscais de um Emitente — cards da tela Facilita NFE',
  })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({
    name: 'documentType',
    required: false,
    enum: ['NFE', 'NFSE', 'NFCE'],
  })
  @ApiQuery({ name: 'sourceSystem', required: false })
  @ApiQuery({ name: 'externalReference', required: false })
  @ApiQuery({ name: 'search', required: false })
  async handle(
    @Query('companyId') companyId?: string,
    @Query('documentType') documentType?: FiscalDocumentType,
    @Query('sourceSystem') sourceSystem?: string,
    @Query('externalReference') externalReference?: string,
    @Query('search') search?: string,
  ) {
    if (!companyId?.trim()) {
      throw new BadRequestException('Query param companyId é obrigatório');
    }

    const counts = await this.getFiscalDocumentsSummary.execute({
      companyId,
      documentType,
      sourceSystem,
      externalReference,
      search,
    });

    return FiscalDocumentSummaryPresenter.toHttp(counts);
  }
}
