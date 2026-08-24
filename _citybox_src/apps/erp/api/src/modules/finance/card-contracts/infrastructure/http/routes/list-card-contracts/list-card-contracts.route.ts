import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListCardContractsUseCase } from '../../../../application/use-cases/list-card-contracts/list-card-contracts.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListCardContractsQueryDto } from '../shared/card-contract.dto';
import { CardContractPresenter } from '../shared/card-contract.presenter';

@ApiTags('card-contracts')
@Controller('v1/card-contracts')
export class ListCardContractsRoute {
  constructor(private readonly listCardContracts: ListCardContractsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar contratos de cartão',
    description:
      '`tabCounts` conta o cadastro inteiro da organização, ignorando a busca.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListCardContractsQueryDto,
  ) {
    const result = await this.listCardContracts.execute({
      organizationId,
      tab: query.tab,
      search: query.search?.trim() || undefined,
      page: query.page,
      perPage: query.perPage,
    });
    return CardContractPresenter.toHttpList(result);
  }
}
