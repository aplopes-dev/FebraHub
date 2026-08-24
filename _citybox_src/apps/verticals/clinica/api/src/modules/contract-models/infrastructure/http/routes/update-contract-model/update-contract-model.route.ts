import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateContractModelUseCase } from '../../../../application/use-cases/update-contract-model/update-contract-model.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateContractModelDto } from './update-contract-model.dto';
import { CreateContractModelPresenter } from '../create-contract-model/create-contract-model.presenter';

@ApiTags('contract-models')
@Controller('v1/contract-models')
@RequirePermission('manage', 'ContractModel')
export class UpdateContractModelRoute {
  constructor(
    private readonly updateContractModel: UpdateContractModelUseCase,
  ) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar modelo de contrato' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContractModelDto,
  ) {
    const model = await this.updateContractModel.execute({
      storeId,
      id,
      ...dto,
    });
    return CreateContractModelPresenter.toHttp(model);
  }
}
