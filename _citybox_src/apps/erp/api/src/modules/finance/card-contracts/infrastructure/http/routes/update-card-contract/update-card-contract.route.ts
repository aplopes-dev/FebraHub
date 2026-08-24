import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateCardContractUseCase } from '../../../../application/use-cases/update-card-contract/update-card-contract.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdateCardContractHttpDto } from '../shared/card-contract.dto';
import { CardContractPresenter } from '../shared/card-contract.presenter';

@ApiTags('card-contracts')
@Controller('v1/card-contracts')
export class UpdateCardContractRoute {
  constructor(private readonly updateCardContract: UpdateCardContractUseCase) {}

  @Put(':id')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Atualizar contrato de cartão',
    description: 'Semântica PUT: campo omitido volta ao default do contrato.',
  })
  @ApiResponse({
    status: 404,
    description: 'Contrato ou conta não encontrados',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCardContractHttpDto,
  ) {
    const item = await this.updateCardContract.execute({
      organizationId,
      id,
      ...dto,
    });
    return CardContractPresenter.toHttpSingle(item);
  }
}
