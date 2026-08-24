import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { FiscalApiProvider } from '../../../../domain/providers/fiscal-api.provider';
import { ResolveFiscalCompanyUseCase } from '../../../../application/use-cases/resolve-fiscal-company/resolve-fiscal-company.use-case';

/** Cards Total/Autorizadas/Canceladas da tela Facilita NF-e. Mesmo tenant da listagem. */
@ApiTags('fiscal')
@Controller('v1/fiscal/documents/summary')
export class GetFiscalSummaryRoute {
  constructor(
    private readonly resolveCompany: ResolveFiscalCompanyUseCase,
    private readonly fiscalApi: FiscalApiProvider,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Resumo dos documentos fiscais da organização ativa',
  })
  @ApiResponse({ status: 404, description: 'Emitente fiscal não configurado' })
  @ApiResponse({ status: 503, description: 'Serviço fiscal indisponível' })
  async handle(@OrganizationId() organizationId: string) {
    const companyId = await this.resolveCompany.execute({ organizationId });
    return this.fiscalApi.getSummary(companyId);
  }
}
