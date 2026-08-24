import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { FiscalApiProvider } from '../../../../domain/providers/fiscal-api.provider';
import { ResolveFiscalCompanyUseCase } from '../../../../application/use-cases/resolve-fiscal-company/resolve-fiscal-company.use-case';

/**
 * Documentos fiscais da organização ativa.
 *
 * ⚠️ **Não existe parâmetro de Emitente, de propósito.** O `companyId` é
 * derivado do tenant (`ResolveFiscalCompanyUseCase`). Aceitá-lo do cliente
 * reabriria o caminho que esta refatoração fechou — ver o adapter M2M.
 */
@ApiTags('fiscal')
@Controller('v1/fiscal/documents')
export class ListFiscalDocumentsRoute {
  constructor(
    private readonly resolveCompany: ResolveFiscalCompanyUseCase,
    private readonly fiscalApi: FiscalApiProvider,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Documentos fiscais emitidos pela organização ativa',
    description:
      'O Emitente é resolvido pelo CNPJ da organização do tenant — o cliente não escolhe.',
  })
  @ApiResponse({ status: 404, description: 'Emitente fiscal não configurado' })
  @ApiResponse({ status: 503, description: 'Serviço fiscal indisponível' })
  async handle(
    @OrganizationId() organizationId: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('model') model?: string,
    @Query('issuedFrom') issuedFrom?: string,
    @Query('issuedTo') issuedTo?: string,
  ) {
    const companyId = await this.resolveCompany.execute({ organizationId });

    return this.fiscalApi.listDocuments({
      companyId,
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      search,
      status,
      model,
      issuedFrom,
      issuedTo,
    });
  }
}
