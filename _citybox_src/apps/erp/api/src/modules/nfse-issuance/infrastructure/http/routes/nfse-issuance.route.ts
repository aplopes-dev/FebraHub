import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../shared/infra/http/decorators/tenant.decorators';
import { IssueNfseUseCase } from '../../../application/use-cases/issue-nfse/issue-nfse.use-case';
import { ListNfseIssuancesUseCase } from '../../../application/use-cases/list-nfse-issuances/list-nfse-issuances.use-case';
import { IssueNfseHttpDto } from './shared/issue-nfse.http.dto';
import { NfseIssuancePresenter } from './shared/nfse-issuance.presenter';

@ApiTags('nfse-issuances')
@Controller('v1/nfse-issuances')
export class NfseIssuanceRoute {
  constructor(
    private readonly issueNfse: IssueNfseUseCase,
    private readonly listIssuances: ListNfseIssuancesUseCase,
  ) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar NFS-e emitidas pela organização' })
  async list(@OrganizationId() organizationId: string) {
    const issuances = await this.listIssuances.execute({ organizationId });
    return NfseIssuancePresenter.toHttpList(issuances);
  }

  @Post()
  @HttpCode(201)
  // Emitir documento fiscal é ação de alto impacto — permissão própria (spec erp/018).
  @RequirePermission('store.fiscal.issue')
  @ApiOperation({ summary: 'Emitir NFS-e (HOMOLOGAÇÃO)' })
  async issue(
    @OrganizationId() organizationId: string,
    @Body() dto: IssueNfseHttpDto,
  ) {
    const issuance = await this.issueNfse.execute({
      organizationId,
      issqnGroupId: dto.issqnGroupId,
      externalReference: dto.externalReference,
      customer: dto.customer,
      serviceDescription: dto.serviceDescription,
      totalValue: dto.totalValue,
      issWithheld: dto.issWithheld,
    });
    return NfseIssuancePresenter.toHttpSingle(issuance);
  }
}
