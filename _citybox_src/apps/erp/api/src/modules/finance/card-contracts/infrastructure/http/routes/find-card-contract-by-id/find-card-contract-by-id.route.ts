import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindCardContractByIdUseCase } from '../../../../application/use-cases/find-card-contract-by-id/find-card-contract-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CardContractPresenter } from '../shared/card-contract.presenter';

@ApiTags('card-contracts')
@Controller('v1/card-contracts')
export class FindCardContractByIdRoute {
  constructor(private readonly findCardContract: FindCardContractByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Detalhar contrato de cartão',
    description: 'Devolve também o excluído — a aba "Excluídos" leva até ele.',
  })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const item = await this.findCardContract.execute({ organizationId, id });
    return CardContractPresenter.toHttpSingle(item);
  }
}
