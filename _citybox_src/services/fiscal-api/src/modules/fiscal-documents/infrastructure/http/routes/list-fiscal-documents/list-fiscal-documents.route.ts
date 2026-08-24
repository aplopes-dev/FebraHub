import type { FiscalDocumentType } from '../../../../domain/entities/fiscal-document.entity';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListFiscalDocumentsUseCase } from '../../../../application/use-cases/list-fiscal-documents/list-fiscal-documents.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { FiscalDocumentPresenter } from '../shared/fiscal-document.presenter';

@ApiTags('fiscal-documents')
@Controller('v1/fiscal-documents')
@RequirePermission('fiscal.documents.view')
export class ListFiscalDocumentsRoute {
  constructor(
    private readonly listFiscalDocuments: ListFiscalDocumentsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Listar documentos fiscais (NF-e, NFS-e, NFC-e) de um Emitente',
  })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({
    name: 'documentType',
    required: false,
    // Corrigido: `NFCE` já era aceito pelo DTO (`FiscalDocumentType`), só a
    // anotação Swagger estava desatualizada (research.md §3.4 da spec
    // `009-facilita-nfe-screen`).
    enum: ['NFE', 'NFSE', 'NFCE'],
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sourceSystem', required: false })
  @ApiQuery({ name: 'externalReference', required: false })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'Busca livre por número ou série (spec 009-facilita-nfe-screen, FR-005)',
  })
  async handle(
    @Query('companyId') companyId?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('documentType') documentType?: FiscalDocumentType,
    @Query('status') status?: string,
    @Query('sourceSystem') sourceSystem?: string,
    @Query('externalReference') externalReference?: string,
    @Query('search') search?: string,
  ) {
    if (!companyId?.trim()) {
      throw new BadRequestException('Query param companyId é obrigatório');
    }

    const result = await this.listFiscalDocuments.execute({
      companyId,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      documentType,
      status,
      sourceSystem,
      externalReference,
      search,
    });

    return FiscalDocumentPresenter.toListHttp(result.documents, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
