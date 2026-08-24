import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListContractModelsUseCase } from '../../../../application/use-cases/list-contract-models/list-contract-models.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { ListContractModelsPresenter } from './list-contract-models.presenter';

@ApiTags('contract-models')
@Controller('v1/contract-models')
@RequirePermission('manage', 'ContractModel')
export class ListContractModelsRoute {
  constructor(private readonly listContractModels: ListContractModelsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar modelos de contrato' })
  async handle(@StoreId() storeId: string) {
    const models = await this.listContractModels.execute({ storeId });
    return ListContractModelsPresenter.toHttp(models);
  }
}
