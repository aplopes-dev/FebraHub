import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../shared/infra/http/decorators/tenant.decorators';
import { IssueNfeUseCase } from '../../../application/use-cases/issue-nfe/issue-nfe.use-case';
import { PreviewNfeIssuanceUseCase } from '../../../application/use-cases/preview-nfe-issuance/preview-nfe-issuance.use-case';
import { ListNfeIssuancesUseCase } from '../../../application/use-cases/list-nfe-issuances/list-nfe-issuances.use-case';
import { IssueNfeHttpDto } from './shared/issue-nfe.http.dto';
import { NfeIssuancePresenter } from './shared/nfe-issuance.presenter';

@ApiTags('nfe-issuances')
@Controller('v1/nfe-issuances')
export class NfeIssuanceRoute {
  constructor(
    private readonly issueNfe: IssueNfeUseCase,
    private readonly previewNfeIssuance: PreviewNfeIssuanceUseCase,
    private readonly listIssuances: ListNfeIssuancesUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar NF-e emitidas pela organização' })
  async list(@OrganizationId() organizationId: string) {
    const issuances = await this.listIssuances.execute({ organizationId });
    return NfeIssuancePresenter.toHttpList(issuances);
  }

  @Get('preview')
  @RequirePermission('org.view')
  @ApiOperation({
    summary:
      'Prévia da emissão (FR-005) — resolve os itens sem chamar a fiscal-api nem persistir',
  })
  async preview(
    @OrganizationId() organizationId: string,
    @Query('saleOrderId') saleOrderId: string,
    @Query('destinationUf') destinationUf?: string,
  ) {
    const preview = await this.previewNfeIssuance.execute({
      organizationId,
      saleOrderId,
      destinationUf,
    });
    return NfeIssuancePresenter.toHttpPreview(preview);
  }

  @Post()
  @HttpCode(201)
  // Emitir documento fiscal é ação de alto impacto — mesma permissão que
  // nfse-issuance usa (spec erp/025/018): emissão fiscal é uma capacidade
  // única, não uma por tipo de documento.
  @RequirePermission('store.fiscal.issue')
  @ApiOperation({ summary: 'Emitir NF-e a partir de um pedido de venda' })
  async issue(
    @OrganizationId() organizationId: string,
    @Body() dto: IssueNfeHttpDto,
  ) {
    const issuance = await this.issueNfe.execute({
      organizationId,
      saleOrderId: dto.saleOrderId,
      customer: dto.customer,
    });
    return NfeIssuancePresenter.toHttpSingle(issuance);
  }
}
