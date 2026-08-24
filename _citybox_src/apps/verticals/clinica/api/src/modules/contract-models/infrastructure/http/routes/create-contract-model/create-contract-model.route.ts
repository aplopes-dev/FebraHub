import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateContractModelUseCase } from '../../../../application/use-cases/create-contract-model/create-contract-model.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { CreateContractModelDto } from './create-contract-model.dto';
import { CreateContractModelPresenter } from './create-contract-model.presenter';

@ApiTags('contract-models')
@Controller('v1/contract-models')
@RequirePermission('manage', 'ContractModel')
export class CreateContractModelRoute {
  constructor(
    private readonly createContractModel: CreateContractModelUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar modelo de contrato' })
  async handle(
    @StoreId() storeId: string,
    @Body() dto: CreateContractModelDto,
  ) {
    const model = await this.createContractModel.execute({ storeId, ...dto });
    return CreateContractModelPresenter.toHttp(model);
  }
}
